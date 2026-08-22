const fs = require('fs');
const readline = require('readline');

async function extractOrdersV2() {
  console.log('Extracting accurate WooCommerce orders with complete metadata...');
  const rl = readline.createInterface({
    input: fs.createReadStream('DATABASE/iranmori_db.sql'),
    crlfDelay: Infinity
  });

  const orders = new Map();
  const orderMeta = new Map();
  let currentTable = null;

  for await (const line of rl) {
    if (line.includes('INSERT INTO `')) {
      const match = line.match(/INSERT INTO `([^`]+)`/);
      currentTable = match ? match[1] : null;
    }

    if (currentTable === 'ss_posts' && line.includes("'shop_order'")) {
      // ss_posts line parsing
      // Tuple regex for shop_order: (ID, author, date, date_gmt, content, title, excerpt, status, ...)
      const regex = /\((\d+),\s*\d+,\s*'([^']+)',\s*'[^']*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'([^']+)',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'(?:[^'\\]|\\.)*',\s*\d+,\s*'[^']*',\s*\d+,\s*'(shop_order|shop_order_refund)'/g;
      let m;
      while ((m = regex.exec(line)) !== null) {
        const [_, id, postDate, postStatus, postType] = m;
        orders.set(id, {
          id,
          orderNumber: `MOR-${id}`,
          date: postDate,
          status: postStatus.replace('wc-', ''),
          type: postType
        });
      }
    }

    if (currentTable === 'ss_postmeta') {
      // (meta_id, post_id, 'meta_key', 'meta_value')
      const regex = /\((\d+),\s*(\d+),\s*'(_[^']+)',\s*'((?:[^'\\]|\\.)*)'/g;
      let m;
      while ((m = regex.exec(line)) !== null) {
        const [_, metaId, postId, key, val] = m;
        if (!orderMeta.has(postId)) orderMeta.set(postId, {});
        orderMeta.get(postId)[key] = val.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\\r/g, '');
      }
    }
  }

  console.log(`Extracted ${orders.size} shop_order posts and ${orderMeta.size} meta records.`);

  const finalOrders = [];
  for (const [id, o] of orders.entries()) {
    const meta = orderMeta.get(id) || {};
    
    // In WooCommerce Iran stores, amounts are usually in Tomans (e.g., 150000) or Rials (1500000)
    let rawTotal = parseFloat(meta._order_total || '0') || 0;
    let totalToman = rawTotal;
    let totalIrr = rawTotal * 10;

    const firstName = meta._billing_first_name || meta._shipping_first_name || '';
    const lastName = meta._billing_last_name || meta._shipping_last_name || '';
    let fullName = `${firstName} ${lastName}`.trim();
    if (!fullName) {
      fullName = 'مشتری فروشگاه';
    }

    const phone = meta._billing_phone || meta._shipping_phone || '';
    const email = meta._billing_email || '';

    const province = meta._billing_state || meta._shipping_state || 'اصفهان';
    const city = meta._billing_city || meta._shipping_city || 'اصفهان';
    const address1 = meta._billing_address_1 || meta._shipping_address_1 || '';
    const address2 = meta._billing_address_2 || meta._shipping_address_2 || '';
    const postalCode = meta._billing_postcode || meta._shipping_postcode || '';
    const fullAddress = [address1, address2].filter(Boolean).join(' ') || `${province}، ${city}`;

    const trackingCode = meta._postchi_tracking_code || meta._tracking_number || meta._post_barcode || meta._tracking_code || meta.barcode || '';
    const shippingMethod = meta._shipping_method_title || 'پست پیشتاز سراسری';
    const paymentMethod = meta._payment_method_title || (meta._payment_method === 'cod' ? 'پرداخت در محل' : 'پرداخت آنلاین زرین‌پال');

    let status = o.status;
    let statusLabel = 'در حال پردازش';
    if (status === 'completed') {
      status = 'delivered';
      statusLabel = 'تحویل داده شده';
    } else if (status === 'processing') {
      status = 'processing';
      statusLabel = 'در حال پردازش';
    } else if (status === 'on-hold') {
      status = 'pending';
      statusLabel = 'در انتظار پرداخت';
    } else if (status === 'cancelled') {
      status = 'cancelled';
      statusLabel = 'لغو شده';
    } else if (status === 'refunded') {
      status = 'cancelled';
      statusLabel = 'بازگشت وجه';
    } else if (status === 'failed') {
      status = 'cancelled';
      statusLabel = 'ناموفق';
    }

    finalOrders.push({
      id: `ord-${id}`,
      orderNumber: `MOR-${id}`,
      createdAt: o.date,
      status,
      statusLabel,
      customerName: fullName,
      customerPhone: phone,
      totalIrr,
      totalToman,
      trackingCode,
      shippingMethod,
      paymentMethod,
      address: {
        recipientName: fullName,
        phone,
        province,
        city,
        addressLine: fullAddress,
        postalCode,
      }
    });
  }

  // Sort newest first
  finalOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  console.log('Sample extracted orders:');
  console.log(finalOrders.slice(0, 5));

  const content = `// Auto-generated WooCommerce Orders list
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

  fs.writeFileSync('apps/web/lib/orders-data.ts', content, 'utf8');
  console.log(`✓ Successfully extracted ${finalOrders.length} orders to apps/web/lib/orders-data.ts`);
}

extractOrdersV2().catch(console.error);
