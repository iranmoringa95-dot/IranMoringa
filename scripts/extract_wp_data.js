const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function main() {
  console.log('Starting WordPress extraction from DATABASE/iranmori_db.sql...');
  
  const rl = readline.createInterface({
    input: fs.createReadStream('DATABASE/iranmori_db.sql'),
    crlfDelay: Infinity
  });

  const usersMap = new Map();
  const userMetaMap = new Map();
  const ordersMap = new Map();
  const orderMetaMap = new Map();

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
    if (v.startsWith("'") && v.endsWith("'")) {
      v = v.slice(1, -1);
    }
    return v.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\r/g, '');
  }

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (lineCount % 100000 === 0) {
      console.log(`Processed ${lineCount} lines...`);
    }

    if (line.startsWith('INSERT INTO `')) {
      const match = line.match(/INSERT INTO `([^`]+)`/);
      currentTable = match ? match[1] : null;
    }

    if (!currentTable) continue;

    if (currentTable === 'ss_users' && line.startsWith('(') || line.includes('INSERT INTO `ss_users`')) {
      const valuePart = line.includes('VALUES') ? line.slice(line.indexOf('VALUES') + 6) : line;
      const rows = parseSQLValues(valuePart);
      for (const row of rows) {
        if (row.length >= 9) {
          const id = cleanVal(row[0]);
          const user_login = cleanVal(row[1]);
          const user_pass = cleanVal(row[2]);
          const user_nicename = cleanVal(row[3]);
          const user_email = cleanVal(row[4]);
          const user_registered = cleanVal(row[6]);
          const display_name = cleanVal(row[9] || row[1]);

          usersMap.set(id, {
            id,
            login: user_login,
            email: user_email,
            registered: user_registered,
            displayName: display_name,
          });
        }
      }
    }

    if (currentTable === 'ss_usermeta' && (line.startsWith('(') || line.includes('INSERT INTO `ss_usermeta`'))) {
      const valuePart = line.includes('VALUES') ? line.slice(line.indexOf('VALUES') + 6) : line;
      const rows = parseSQLValues(valuePart);
      for (const row of rows) {
        if (row.length >= 4) {
          const userId = cleanVal(row[1]);
          const metaKey = cleanVal(row[2]);
          const metaValue = cleanVal(row[3]);

          if (!userMetaMap.has(userId)) {
            userMetaMap.set(userId, {});
          }
          userMetaMap.get(userId)[metaKey] = metaValue;
        }
      }
    }

    if (currentTable === 'ss_posts' && (line.startsWith('(') || line.includes('INSERT INTO `ss_posts`'))) {
      if (line.includes("'shop_order'")) {
        const valuePart = line.includes('VALUES') ? line.slice(line.indexOf('VALUES') + 6) : line;
        const rows = parseSQLValues(valuePart);
        for (const row of rows) {
          // ID, post_author, post_date, ..., post_status, ..., post_name, ..., post_type
          // Usually post_type is around index 20, post_status around index 7
          const id = cleanVal(row[0]);
          const post_date = cleanVal(row[2]);
          const post_status = cleanVal(row[7]);
          const post_type = row.find(c => cleanVal(c) === 'shop_order');
          if (post_type) {
            ordersMap.set(id, {
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
      if (line.includes('_order_total') || line.includes('_customer_user') || line.includes('_billing_') || line.includes('_shipping_')) {
        const valuePart = line.includes('VALUES') ? line.slice(line.indexOf('VALUES') + 6) : line;
        const rows = parseSQLValues(valuePart);
        for (const row of rows) {
          if (row.length >= 4) {
            const postId = cleanVal(row[1]);
            const metaKey = cleanVal(row[2]);
            const metaValue = cleanVal(row[3]);

            if (ordersMap.has(postId)) {
              if (!orderMetaMap.has(postId)) {
                orderMetaMap.set(postId, {});
              }
              orderMetaMap.get(postId)[metaKey] = metaValue;
            }
          }
        }
      }
    }
  }

  console.log(`Parsed ${usersMap.size} users, ${ordersMap.size} orders, ${userMetaMap.size} user meta profiles.`);

  // Build combined customers array
  const customers = [];

  function normalizePhone(raw) {
    if (!raw) return '';
    let c = raw.replace(/[^\d+]/g, '');
    if (c.startsWith('+98')) c = '0' + c.slice(3);
    else if (c.startsWith('0098')) c = '0' + c.slice(4);
    else if (c.startsWith('98') && c.length === 12) c = '0' + c.slice(2);
    else if (c.length === 10 && c.startsWith('9')) c = '0' + c;
    return c;
  }

  for (const [id, user] of usersMap.entries()) {
    const meta = userMetaMap.get(id) || {};
    const firstName = meta.first_name || meta.billing_first_name || '';
    const lastName = meta.last_name || meta.billing_last_name || '';
    let phone = meta.digits_phone || meta.billing_phone || user.login || '';
    phone = normalizePhone(phone);
    if (!phone.startsWith('09') && meta.billing_phone) {
      phone = normalizePhone(meta.billing_phone);
    }
    if (!phone.startsWith('09') && user.login.startsWith('09')) {
      phone = normalizePhone(user.login);
    }

    const province = meta.billing_state || 'اصفهان';
    const city = meta.billing_city || 'اصفهان';
    const postalAddress = [meta.billing_address_1, meta.billing_address_2].filter(Boolean).join(' ') || 'ثبت شده در سفارش';
    const postalCode = meta.billing_postcode || '';

    // Calculate customer orders
    let totalSpentIrr = 0;
    let totalOrders = 0;
    let lastOrderDate = null;

    for (const [orderId, order] of ordersMap.entries()) {
      const oMeta = orderMetaMap.get(orderId) || {};
      if (oMeta._customer_user === id || oMeta._billing_phone === phone) {
        totalOrders++;
        const total = parseFloat(oMeta._order_total || '0') * 10; // WooCommerce Rial to IRR
        totalSpentIrr += total;
        if (!lastOrderDate || order.date > lastOrderDate) {
          lastOrderDate = order.date;
        }
      }
    }

    const totalSpentToman = Math.floor(totalSpentIrr / 10);
    let tier = 'bronze';
    if (totalSpentToman >= 3000000 || totalOrders >= 5) tier = 'gold';
    else if (totalSpentToman >= 1000000 || totalOrders >= 2) tier = 'silver';

    const isAdmin = meta.ss_capabilities && (meta.ss_capabilities.includes('administrator') || meta.ss_capabilities.includes('shop_manager'));

    customers.push({
      id: `usr-${id}`,
      phone: phone || (user.login.startsWith('09') ? user.login : '09' + String(100000000 + parseInt(id)).slice(0, 9)),
      email: user.email || '',
      firstName: firstName || user.displayName || 'کاربر',
      lastName: lastName,
      fullName: `${firstName} ${lastName}`.trim() || user.displayName || 'مشتری مورینگا',
      nationalId: meta.billing_national_code || '',
      birthDate: meta.birth_date || '',
      isActive: true,
      status: 'active',
      createdAt: user.registered || '2023-01-01',
      updatedAt: user.registered || '2023-01-01',
      addressId: `addr-${id}`,
      addressTitle: 'آدرس اصلی',
      recipientName: `${firstName} ${lastName}`.trim() || user.displayName,
      recipientPhone: phone,
      city: city || 'اصفهان',
      province: province || 'اصفهان',
      postalAddress: postalAddress,
      postalCode: postalCode,
      totalOrders,
      totalSpentIrr,
      totalSpentToman,
      lastOrderDate,
      tier,
      isAdmin: Boolean(isAdmin),
      adminRole: isAdmin ? 'super_admin' : null,
      isSuperAdmin: Boolean(isAdmin),
      adminCustomTitle: isAdmin ? 'مدیر ارشد' : null,
    });
  }

  console.log(`Generated ${customers.length} full customer records.`);

  // Write customers-data.ts
  const customersTsContent = `// Auto-generated from WordPress & WooCommerce live database
export interface CustomerItem {
  id: string;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationalId: string;
  birthDate: string;
  isActive: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  addressId: string;
  addressTitle: string;
  recipientName: string;
  recipientPhone: string;
  city: string;
  province: string;
  postalAddress: string;
  postalCode: string;
  totalOrders: number;
  totalSpentIrr: number;
  totalSpentToman: number;
  lastOrderDate: string | null;
  tier: 'gold' | 'silver' | 'bronze';
  isAdmin: boolean;
  adminRole: string | null;
  isSuperAdmin: boolean;
  adminCustomTitle: string | null;
}

export const WORDPRESS_CUSTOMERS: CustomerItem[] = ${JSON.stringify(customers, null, 2)};
`;

  fs.writeFileSync('apps/web/lib/customers-data.ts', customersTsContent, 'utf8');
  console.log('✓ Successfully wrote apps/web/lib/customers-data.ts');
}

main().catch(console.error);
