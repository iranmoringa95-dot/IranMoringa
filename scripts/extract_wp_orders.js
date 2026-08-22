const fs = require('fs');
const readline = require('readline');

async function main() {
  console.log('Extracting WooCommerce orders...');
  
  const rl = readline.createInterface({
    input: fs.createReadStream('DATABASE/iranmori_db.sql'),
    crlfDelay: Infinity
  });

  const orders = new Map();
  const orderMeta = new Map();
  let currentTable = null;

  function parseSQLValues(sqlChunk) {
    const rows = [];
    let inParen = false;
    let inQuote = false;
    let currentCell = '';
    let currentRow = [];
    let isEscaped = false;

    for (let i = 0; i < sqlChunk.length; i++) {
      const char = sqlChunk[i];

      if (isEscaped) {
        currentCell += char;
        isEscaped = false;
        continue;
      }

      if (char === '\\') {
        isEscaped = true;
        currentCell += char;
        continue;
      }

      if (char === "'" && !isEscaped) {
        inQuote = !inQuote;
        currentCell += char;
        continue;
      }

      if (!inQuote) {
        if (char === '(') {
          inParen = true;
          currentRow = [];
          currentCell = '';
          continue;
        }
        if (char === ')') {
          inParen = false;
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
          continue;
        }
        if (char === ',' && inParen) {
          currentRow.push(currentCell.trim());
          currentCell = '';
          continue;
        }
      }

      if (inParen) {
        currentCell += char;
      }
    }
    return rows;
  }

  function cleanVal(v) {
    if (!v) return '';
    v = v.trim();
    if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
    return v.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\r/g, '');
  }

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `')) {
      const match = line.match(/INSERT INTO `([^`]+)`/);
      currentTable = match ? match[1] : null;
    }

    if (!currentTable) continue;

    if (currentTable === 'ss_posts' && (line.startsWith('(') || line.includes('INSERT INTO `ss_posts`'))) {
      if (line.includes("'shop_order'")) {
        const valuePart = line.includes('VALUES') ? line.slice(line.indexOf('VALUES') + 6) : line;
        const rows = parseSQLValues(valuePart);
        for (const row of rows) {
          const id = cleanVal(row[0]);
          const post_date = cleanVal(row[2]);
          const post_status = cleanVal(row[7]);
          const post_type = row.find(c => cleanVal(c) === 'shop_order');
          if (post_type) {
            orders.set(id, {
              id,
              orderNumber: `MOR-${id}`,
              date: post_date,
              status: post_status.replace('wc-', ''),
            });
          }
        }
      }
    }

    if (currentTable === 'ss_postmeta' && (line.startsWith('(') || line.includes('INSERT INTO `ss_postmeta`'))) {
      const valuePart = line.includes('VALUES') ? line.slice(line.indexOf('VALUES') + 6) : line;
      const rows = parseSQLValues(valuePart);
      for (const row of rows) {
        if (row.length >= 4) {
          const postId = cleanVal(row[1]);
          const metaKey = cleanVal(row[2]);
          const metaValue = cleanVal(row[3]);

          if (orders.has(postId)) {
            if (!orderMeta.has(postId)) orderMeta.set(postId, {});
            orderMeta.get(postId)[metaKey] = metaValue;
          }
        }
      }
    }
  }

  const finalOrders = [];
  for (const [id, o] of orders.entries()) {
    const meta = orderMeta.get(id) || {};
    const totalIrr = Math.round(parseFloat(meta._order_total || '0') * 10);
    const totalToman = Math.floor(totalIrr / 10);
    const customerName = `${meta._billing_first_name || ''} ${meta._billing_last_name || ''}`.trim() || 'مشتری';

    finalOrders.push({
      id: `ord-${id}`,
      orderNumber: `MOR-${id}`,
      createdAt: o.date,
      status: o.status === 'completed' ? 'delivered' : o.status === 'processing' ? 'processing' : o.status === 'cancelled' ? 'cancelled' : 'processing',
      statusLabel: o.status === 'completed' ? 'تحویل داده شده' : o.status === 'processing' ? 'در حال پردازش' : o.status === 'cancelled' ? 'لغو شده' : 'ثبت شده',
      customerName,
      customerPhone: meta._billing_phone || '',
      totalIrr,
      totalToman,
      trackingCode: meta._postchi_tracking_code || meta._tracking_number || '',
      shippingMethod: meta._shipping_method_title || 'پست پیشتاز',
      paymentMethod: meta._payment_method_title || 'پرداخت آنلاین',
      address: {
        recipientName: customerName,
        phone: meta._billing_phone || '',
        province: meta._billing_state || 'اصفهان',
        city: meta._billing_city || 'اصفهان',
        addressLine: [meta._billing_address_1, meta._billing_address_2].filter(Boolean).join(' ') || 'آدرس ثبت شده در فاکتور',
        postalCode: meta._billing_postcode || '',
      }
    });
  }

  // Sort newest first
  finalOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const ordersTsContent = `// Auto-generated WooCommerce Orders list
export interface StoreOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'pending';
  statusLabel: string;
  customerName: string;
  customerPhone: string;
  totalIrr: number;
  totalToman: number;
  trackingCode?: string;
  shippingMethod: string;
  paymentMethod: string;
  address: {
    recipientName: string;
    phone: string;
    province: string;
    city: string;
    addressLine: string;
    postalCode: string;
  };
}

export const STORE_ORDERS: StoreOrder[] = ${JSON.stringify(finalOrders, null, 2)};
`;

  fs.writeFileSync('apps/web/lib/orders-data.ts', ordersTsContent, 'utf8');
  console.log(`✓ Successfully extracted ${finalOrders.length} orders to apps/web/lib/orders-data.ts`);
}

main().catch(console.error);
