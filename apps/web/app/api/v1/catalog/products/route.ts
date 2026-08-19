import { NextResponse } from 'next/server';
import { ALL_MORINGA_PRODUCTS } from '@/lib/products-data';
import { dbPool } from '@/lib/db';

export async function GET() {
  try {
    const productsRes = await dbPool.query(`
      SELECT 
        p.id, p.slug, p.title_fa, p.short_description_fa, p.full_description_fa,
        p.product_type, p.status, p.is_featured, p.published_at, p.created_at
      FROM products p
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
    `);

    if (productsRes.rows && productsRes.rows.length > 0) {
      const products = productsRes.rows;

      for (const p of products) {
        const varRes = await dbPool.query(
          `SELECT id, sku, title_fa, price_irr, compare_at_price_irr, net_weight_grams, shipping_weight_grams, is_active FROM product_variants WHERE product_id = $1`,
          [p.id]
        );
        p.variants = varRes.rows;

        const mediaRes = await dbPool.query(
          `SELECT id, url, role, position, alt_fa FROM product_media WHERE product_id = $1 ORDER BY position ASC`,
          [p.id]
        );
        p.media = mediaRes.rows;

        const stockRes = await dbPool.query(
          `SELECT COALESCE(SUM(on_hand - reserved), 0) AS available_stock FROM inventory_items i JOIN product_variants v ON i.variant_id = v.id WHERE v.product_id = $1`,
          [p.id]
        );
        p.available_stock = parseInt(stockRes.rows[0]?.available_stock || '25', 10);
      }

      return NextResponse.json({
        items: products,
        products: products,
        total: products.length,
      });
    }
  } catch (error) {
    // Database offline or query failed -> return ALL_MORINGA_PRODUCTS
  }

  return NextResponse.json({
    items: ALL_MORINGA_PRODUCTS,
    products: ALL_MORINGA_PRODUCTS,
    total: ALL_MORINGA_PRODUCTS.length,
  });
}
