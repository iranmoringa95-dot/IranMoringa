const fs = require('fs');

const rawCust = fs.readFileSync('apps/web/lib/customers-data.ts', 'utf8');
const custJsonMatch = rawCust.match(/WORDPRESS_CUSTOMERS:\s*CustomerItem\[\]\s*=\s*(\[[\s\S]*?\]);/);
const customers = custJsonMatch ? JSON.parse(custJsonMatch[1]) : [];

const rawOrders = fs.readFileSync('apps/web/lib/orders-data.ts', 'utf8');
const orderJsonMatch = rawOrders.match(/STORE_ORDERS:\s*StoreOrder\[\]\s*=\s*(\[[\s\S]*?\]);/);
const orders = orderJsonMatch ? JSON.parse(orderJsonMatch[1]) : [];

console.log(`Loaded ${customers.length} customers and ${orders.length} orders for D1 SQL generation.`);

let d1Sql = `-- Cloudflare D1 Full Database Schema and Data Export
-- Generated for IranMoringa Production Deployment

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_admin INTEGER NOT NULL DEFAULT 0,
    admin_role TEXT,
    tier TEXT DEFAULT 'bronze',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customer_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    national_id TEXT,
    birth_date TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent_irr INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT DEFAULT 'آدرس اصلی',
    recipient_name TEXT,
    recipient_phone TEXT,
    province TEXT,
    city TEXT,
    postal_address TEXT,
    postal_code TEXT,
    is_default INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    user_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    status TEXT NOT NULL DEFAULT 'processing',
    status_label TEXT,
    total_irr INTEGER NOT NULL DEFAULT 0,
    tracking_code TEXT,
    shipping_method TEXT,
    payment_method TEXT,
    province TEXT,
    city TEXT,
    postal_address TEXT,
    postal_code TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert Users
`;

for (const c of customers) {
  const safePhone = c.phone.replace(/'/g, "''");
  const safeEmail = (c.email || '').replace(/'/g, "''");
  const safeFirst = (c.firstName || '').replace(/'/g, "''");
  const safeLast = (c.lastName || '').replace(/'/g, "''");
  const safeAdminRole = (c.adminRole || '').replace(/'/g, "''");
  const isAdmin = c.isAdmin ? 1 : 0;
  const safeTier = (c.tier || 'bronze').replace(/'/g, "''");
  const safeDate = (c.createdAt || '2023-01-01').replace(/'/g, "''");

  d1Sql += `INSERT OR IGNORE INTO users (id, phone, email, first_name, last_name, is_active, is_admin, admin_role, tier, created_at, updated_at) VALUES ('${c.id}', '${safePhone}', '${safeEmail}', '${safeFirst}', '${safeLast}', 1, ${isAdmin}, '${safeAdminRole}', '${safeTier}', '${safeDate}', '${safeDate}');\n`;

  const safeNationalId = (c.nationalId || '').replace(/'/g, "''");
  const safeBirth = (c.birthDate || '').replace(/'/g, "''");
  d1Sql += `INSERT OR IGNORE INTO customer_profiles (id, user_id, national_id, birth_date, total_orders, total_spent_irr, created_at) VALUES ('prof-${c.id}', '${c.id}', '${safeNationalId}', '${safeBirth}', ${c.totalOrders || 0}, ${c.totalSpentIrr || 0}, '${safeDate}');\n`;

  const safeRecip = (c.recipientName || '').replace(/'/g, "''");
  const safeRecipPhone = (c.recipientPhone || safePhone).replace(/'/g, "''");
  const safeProv = (c.province || 'اصفهان').replace(/'/g, "''");
  const safeCity = (c.city || 'اصفهان').replace(/'/g, "''");
  const safeAddr = (c.postalAddress || '').replace(/'/g, "''");
  const safePostCode = (c.postalCode || '').replace(/'/g, "''");

  d1Sql += `INSERT OR IGNORE INTO addresses (id, user_id, title, recipient_name, recipient_phone, province, city, postal_address, postal_code, is_default, created_at) VALUES ('${c.addressId}', '${c.id}', 'آدرس اصلی', '${safeRecip}', '${safeRecipPhone}', '${safeProv}', '${safeCity}', '${safeAddr}', '${safePostCode}', 1, '${safeDate}');\n`;
}

// Insert Orders
d1Sql += `\n-- Insert Orders\n`;
for (const o of orders) {
  const safeOrderNum = o.orderNumber.replace(/'/g, "''");
  const safeName = (o.customerName || '').replace(/'/g, "''");
  const safePhone = (o.customerPhone || '').replace(/'/g, "''");
  const safeStatus = (o.status || 'processing').replace(/'/g, "''");
  const safeLabel = (o.statusLabel || 'در حال پردازش').replace(/'/g, "''");
  const safeTrack = (o.trackingCode || '').replace(/'/g, "''");
  const safeShip = (o.shippingMethod || 'پست پیشتاز').replace(/'/g, "''");
  const safePay = (o.paymentMethod || 'پرداخت آنلاین').replace(/'/g, "''");
  const addr = o.address || {};
  const safeProv = (addr.province || 'اصفهان').replace(/'/g, "''");
  const safeCity = (addr.city || 'اصفهان').replace(/'/g, "''");
  const safeAddrLine = (addr.addressLine || '').replace(/'/g, "''");
  const safePostCode = (addr.postalCode || '').replace(/'/g, "''");
  const safeDate = (o.createdAt || '2023-01-01').replace(/'/g, "''");

  d1Sql += `INSERT OR IGNORE INTO orders (id, order_number, customer_name, customer_phone, status, status_label, total_irr, tracking_code, shipping_method, payment_method, province, city, postal_address, postal_code, created_at) VALUES ('${o.id}', '${safeOrderNum}', '${safeName}', '${safePhone}', '${safeStatus}', '${safeLabel}', ${o.totalIrr || 0}, '${safeTrack}', '${safeShip}', '${safePay}', '${safeProv}', '${safeCity}', '${safeAddrLine}', '${safePostCode}', '${safeDate}');\n`;
}

fs.writeFileSync('DATABASE/cloudflare_d1_export.sql', d1Sql, 'utf8');
console.log('✓ Successfully generated DATABASE/cloudflare_d1_export.sql');
