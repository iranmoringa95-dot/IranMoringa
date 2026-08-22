import sqlite3
import psycopg2
import uuid
import re
import urllib.parse
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

print("==================================================================")
print("🚀 Starting WordPress/WooCommerce to PostgreSQL Migration Pipeline")
print("==================================================================")

sqlite_path = r'C:\Users\Sarzamin Laptop\.gemini\antigravity\brain\bcf38246-bf90-468f-aaa8-e632881814df\scratch\wp_staging.sqlite'
s_conn = sqlite3.connect(sqlite_path)
s_cur = s_conn.cursor()

p_conn = psycopg2.connect(
    host="127.0.0.1",
    port=5433,
    user="moringa_app",
    password="@KamalGeraei990",
    dbname="moringa_dev"
)
p_conn.autocommit = False
p_cur = p_conn.cursor()

def normalize_phone(raw):
    if not raw:
        return None
    persian_to_eng = str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧۸۹', '01234567890123456789')
    cleaned = str(raw).translate(persian_to_eng)
    cleaned = re.sub(r'[^\d+]', '', cleaned)
    if cleaned.startswith('+98'):
        cleaned = '0' + cleaned[3:]
    elif cleaned.startswith('0098'):
        cleaned = '0' + cleaned[4:]
    elif cleaned.startswith('98') and len(cleaned) == 12:
        cleaned = '0' + cleaned[2:]
    elif len(cleaned) == 10 and cleaned.startswith('9'):
        cleaned = '0' + cleaned
    
    if len(cleaned) == 11 and cleaned.startswith('09'):
        return '+98' + cleaned[1:]
    return None

def clean_slug(raw):
    if not raw:
        return f"item-{uuid.uuid4().hex[:8]}"
    unquoted = urllib.parse.unquote(raw).strip().lower()
    unquoted = re.sub(r'[\s_]+', '-', unquoted)
    unquoted = re.sub(r'[^\w\-\u0600-\u06FF]', '', unquoted)
    unquoted = re.sub(r'-+', '-', unquoted).strip('-')
    return unquoted or f"item-{uuid.uuid4().hex[:8]}"

try:
    # ─── 0. Get or Create Default Brand & Inventory Location ───────────────────
    p_cur.execute("SELECT id FROM brands WHERE slug='moringa-iran' LIMIT 1;")
    res = p_cur.fetchone()
    if res:
        brand_id = res[0]
    else:
        brand_id = str(uuid.uuid4())
        p_cur.execute("""
            INSERT INTO brands (id, name_fa, slug)
            VALUES (%s, %s, %s);
        """, (brand_id, 'مورینگا ایران', 'moringa-iran'))

    p_cur.execute("SELECT id FROM inventory_locations LIMIT 1;")
    res = p_cur.fetchone()
    if res:
        loc_id = res[0]
    else:
        loc_id = str(uuid.uuid4())
        p_cur.execute("INSERT INTO inventory_locations (id, name) VALUES (%s, %s);", (loc_id, 'انبار مرکزی ایران مورینگا'))

    print(f"✓ Brand ID: {brand_id}")
    print(f"✓ Inventory Location ID: {loc_id}")

    # ─── 1. Migrate Products & Variants ───────────────────────────────────────
    print("\n--- Migrating Products & Variants ---")
    s_cur.execute("""
        SELECT p.ID, p.post_title, p.post_name, p.post_content, p.post_excerpt, p.post_status, p.post_date, p.post_type, p.post_parent
        FROM ss_posts p
        WHERE p.post_type IN ('product', 'product_variation')
        ORDER BY p.post_type DESC, p.ID ASC;
    """)
    wp_products_raw = s_cur.fetchall()

    wp_product_to_uuid = {}
    wp_variant_to_uuid = {}
    used_product_slugs = set()
    used_skus = set()

    p_cur.execute("SELECT slug FROM products;")
    for row in p_cur.fetchall():
        used_product_slugs.add(row[0])
    p_cur.execute("SELECT sku FROM product_variants;")
    for row in p_cur.fetchall():
        used_skus.add(row[0])

    imported_products_cnt = 0
    imported_variants_cnt = 0

    for pid, ptitle, pname, pcontent, pexcerpt, pstatus, pdate, ptype, pparent in wp_products_raw:
        s_cur.execute("SELECT meta_key, meta_value FROM ss_postmeta WHERE post_id=?", (pid,))
        meta = dict(s_cur.fetchall())

        if ptype == 'product':
            prod_id = str(uuid.uuid4())
            wp_product_to_uuid[pid] = prod_id

            base_slug = clean_slug(pname)
            slug = base_slug
            idx = 1
            while slug in used_product_slugs:
                slug = f"{base_slug}-{idx}"
                idx += 1
            used_product_slugs.add(slug)

            status = 'published' if pstatus == 'publish' else 'draft'
            title_fa = (ptitle or f"محصول مورینگا {pid}")[:250]
            short_desc = pexcerpt or ""
            full_desc = pcontent or ""
            seo_title = (meta.get('_yoast_wpseo_title') or title_fa)[:250]
            seo_desc = meta.get('_yoast_wpseo_metadesc') or short_desc

            p_cur.execute("""
                INSERT INTO products (
                    id, brand_id, slug, title_fa, short_description_fa, full_description_fa,
                    product_type, status, is_featured, seo_title, seo_description, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                prod_id, brand_id, slug, title_fa, short_desc, full_desc,
                'simple', status, False, seo_title, seo_desc, pdate or 'now()', pdate or 'now()'
            ))
            imported_products_cnt += 1

            raw_price = meta.get('_price') or meta.get('_regular_price') or '0'
            try:
                price_toman = int(float(raw_price))
            except:
                price_toman = 0
            price_irr = max(0, price_toman * 10)

            raw_reg_price = meta.get('_regular_price') or '0'
            try:
                reg_toman = int(float(raw_reg_price))
            except:
                reg_toman = 0
            compare_price_irr = reg_toman * 10 if (reg_toman * 10 > price_irr and price_irr > 0) else None

            sku_candidate = (meta.get('_sku') or f"WP-PROD-{pid}").strip()[:100]
            sku = sku_candidate
            idx = 1
            while sku in used_skus:
                sku = f"{sku_candidate}-{idx}"[:100]
                idx += 1
            used_skus.add(sku)

            raw_stock = meta.get('_stock') or '10'
            try:
                stock_qty = max(0, int(float(raw_stock)))
            except:
                stock_qty = 10

            variant_id = str(uuid.uuid4())
            wp_variant_to_uuid[pid] = variant_id

            p_cur.execute("""
                INSERT INTO product_variants (
                    id, product_id, sku, title_fa, price_irr, compare_at_price_irr,
                    net_weight_grams, shipping_weight_grams, is_active, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                variant_id, prod_id, sku, title_fa[:200], price_irr, compare_price_irr,
                100, 150, True, pdate or 'now()'
            ))
            imported_variants_cnt += 1

            inv_item_id = str(uuid.uuid4())
            p_cur.execute("""
                INSERT INTO inventory_items (id, location_id, variant_id, on_hand, reserved, reorder_point)
                VALUES (%s, %s, %s, %s, 0, 5);
            """, (inv_item_id, loc_id, variant_id, stock_qty))

            p_cur.execute("""
                INSERT INTO inventory_movements (id, inventory_item_id, movement_type, quantity_delta, reason, created_at)
                VALUES (%s, %s, 'receive', %s, 'مهاجرت اولیه موجودی از دیتابیس وردپرس', %s);
            """, (str(uuid.uuid4()), inv_item_id, stock_qty, pdate or 'now()'))

        elif ptype == 'product_variation':
            parent_prod_id = wp_product_to_uuid.get(pparent)
            if not parent_prod_id:
                continue

            variant_id = str(uuid.uuid4())
            wp_variant_to_uuid[pid] = variant_id

            raw_price = meta.get('_price') or meta.get('_regular_price') or '0'
            try:
                price_toman = int(float(raw_price))
            except:
                price_toman = 0
            price_irr = max(0, price_toman * 10)

            raw_reg_price = meta.get('_regular_price') or '0'
            try:
                reg_toman = int(float(raw_reg_price))
            except:
                reg_toman = 0
            compare_price_irr = reg_toman * 10 if (reg_toman * 10 > price_irr and price_irr > 0) else None

            sku_candidate = (meta.get('_sku') or f"WP-VAR-{pid}").strip()[:100]
            sku = sku_candidate
            idx = 1
            while sku in used_skus:
                sku = f"{sku_candidate}-{idx}"[:100]
                idx += 1
            used_skus.add(sku)

            raw_stock = meta.get('_stock') or '10'
            try:
                stock_qty = max(0, int(float(raw_stock)))
            except:
                stock_qty = 10

            var_title = (ptitle or f"واریانت {pid}")[:200]

            p_cur.execute("""
                INSERT INTO product_variants (
                    id, product_id, sku, title_fa, price_irr, compare_at_price_irr,
                    net_weight_grams, shipping_weight_grams, is_active, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                variant_id, parent_prod_id, sku, var_title, price_irr, compare_price_irr,
                100, 150, True, pdate or 'now()'
            ))
            imported_variants_cnt += 1

            inv_item_id = str(uuid.uuid4())
            p_cur.execute("""
                INSERT INTO inventory_items (id, location_id, variant_id, on_hand, reserved, reorder_point)
                VALUES (%s, %s, %s, %s, 0, 5);
            """, (inv_item_id, loc_id, variant_id, stock_qty))

            p_cur.execute("""
                INSERT INTO inventory_movements (id, inventory_item_id, movement_type, quantity_delta, reason, created_at)
                VALUES (%s, %s, 'receive', %s, 'مهاجرت اولیه موجودی واریانت از وردپرس', %s);
            """, (str(uuid.uuid4()), inv_item_id, stock_qty, pdate or 'now()'))

    print(f"✓ Products Imported: {imported_products_cnt}")
    print(f"✓ Variants & Inventory Ledger Created: {imported_variants_cnt}")

    fallback_prod_id = str(uuid.uuid4())
    fallback_var_id = str(uuid.uuid4())
    p_cur.execute("""
        INSERT INTO products (
            id, brand_id, slug, title_fa, short_description_fa, full_description_fa,
            product_type, status, is_featured, created_at, updated_at
        ) VALUES (%s, %s, 'archived-moringa-item', 'محصول آرشیوشده مورینگا', 'محصول آرشیوی سفارش‌های قدیمی', '', 'simple', 'archived', false, 'now()', 'now()');
    """, (fallback_prod_id, brand_id))

    p_cur.execute("""
        INSERT INTO product_variants (
            id, product_id, sku, title_fa, price_irr, net_weight_grams, shipping_weight_grams, is_active
        ) VALUES (%s, %s, 'ARCHIVED-ITEM', 'واریانت آرشیو', 0, 100, 150, false);
    """, (fallback_var_id, fallback_prod_id))


    # ─── 2. Migrate Users, Customer Profiles & Addresses ──────────────────────
    print("\n--- Migrating Users & Profiles ---")
    
    customer_registry = {}

    s_cur.execute("SELECT ID, user_login, user_email, display_name, user_registered FROM ss_users")
    for uid, login, email, disp, reg_date in s_cur.fetchall():
        s_cur.execute("SELECT meta_key, meta_value FROM ss_usermeta WHERE user_id=?", (uid,))
        meta = dict(s_cur.fetchall())
        
        raw_phone = meta.get('digits_phone_no') or meta.get('digits_phone') or meta.get('billing_phone') or login
        norm_phone = normalize_phone(raw_phone)
        if norm_phone:
            fname = meta.get('first_name') or meta.get('billing_first_name') or disp or 'مشتری'
            lname = meta.get('last_name') or meta.get('billing_last_name') or ''
            customer_registry[norm_phone] = {
                'wp_user_id': uid,
                'phone': norm_phone,
                'email': (email or meta.get('billing_email') or '').strip() or None,
                'first_name': str(fname).strip()[:100],
                'last_name': str(lname).strip()[:100],
                'address': (meta.get('billing_address_1') or '').strip(),
                'city': (meta.get('billing_city') or '').strip(),
                'province': (meta.get('billing_state') or '').strip(),
                'postal_code': (meta.get('billing_postcode') or '').strip(),
                'created_at': reg_date or 'now()'
            }

    s_cur.execute("""
        SELECT p.ID, p.post_date,
               (SELECT meta_value FROM ss_postmeta WHERE post_id=p.ID AND meta_key='_billing_phone' LIMIT 1) as bphone,
               (SELECT meta_value FROM ss_postmeta WHERE post_id=p.ID AND meta_key='_billing_email' LIMIT 1) as bemail,
               (SELECT meta_value FROM ss_postmeta WHERE post_id=p.ID AND meta_key='_billing_first_name' LIMIT 1) as bfname,
               (SELECT meta_value FROM ss_postmeta WHERE post_id=p.ID AND meta_key='_billing_last_name' LIMIT 1) as blname,
               (SELECT meta_value FROM ss_postmeta WHERE post_id=p.ID AND meta_key='_billing_address_1' LIMIT 1) as baddr,
               (SELECT meta_value FROM ss_postmeta WHERE post_id=p.ID AND meta_key='_billing_city' LIMIT 1) as bcity,
               (SELECT meta_value FROM ss_postmeta WHERE post_id=p.ID AND meta_key='_billing_state' LIMIT 1) as bprov,
               (SELECT meta_value FROM ss_postmeta WHERE post_id=p.ID AND meta_key='_billing_postcode' LIMIT 1) as bpost
        FROM ss_posts p
        WHERE p.post_type='shop_order';
    """)
    for oid, odate, bphone, bemail, bfname, blname, baddr, bcity, bprov, bpost in s_cur.fetchall():
        norm_phone = normalize_phone(bphone)
        if norm_phone and norm_phone not in customer_registry:
            fname = (bfname or 'مشتری').strip()[:100]
            lname = (blname or '').strip()[:100]
            customer_registry[norm_phone] = {
                'wp_user_id': None,
                'phone': norm_phone,
                'email': (bemail or '').strip() or None,
                'first_name': fname,
                'last_name': lname,
                'address': (baddr or '').strip(),
                'city': (bcity or '').strip(),
                'province': (bprov or '').strip(),
                'postal_code': (bpost or '').strip(),
                'created_at': odate or 'now()'
            }

    phone_to_user_uuid = {}
    wp_uid_to_user_uuid = {}
    used_emails = set()

    p_cur.execute("SELECT email FROM users WHERE email IS NOT NULL;")
    for row in p_cur.fetchall():
        used_emails.add(row[0].lower())

    imported_users_cnt = 0
    imported_addresses_cnt = 0

    for phone, cdata in customer_registry.items():
        user_uuid = str(uuid.uuid4())
        prof_uuid = str(uuid.uuid4())
        phone_to_user_uuid[phone] = user_uuid
        if cdata['wp_user_id']:
            wp_uid_to_user_uuid[cdata['wp_user_id']] = user_uuid

        email = cdata['email']
        if email:
            email_lower = email.lower()
            if email_lower in used_emails or len(email) > 255 or '@' not in email:
                email = None
            else:
                used_emails.add(email_lower)

        # 1. Insert user
        p_cur.execute("""
            INSERT INTO users (id, phone, email, first_name, last_name, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, true, %s, %s);
        """, (user_uuid, phone, email, cdata['first_name'], cdata['last_name'], cdata['created_at'], cdata['created_at']))
        imported_users_cnt += 1

        # 2. Insert customer profile
        p_cur.execute("""
            INSERT INTO customer_profiles (id, user_id, created_at)
            VALUES (%s, %s, %s);
        """, (prof_uuid, user_uuid, cdata['created_at']))

        # 3. Insert address if provided
        addr_text = cdata['address']
        city = (cdata['city'] or 'نامشخص')[:100]
        province = (cdata['province'] or 'نامشخص')[:100]
        postcode = re.sub(r'\D', '', cdata['postal_code'] or '')[:10] or '0000000000'

        if addr_text:
            recip_name = f"{cdata['first_name']} {cdata['last_name']}".strip()[:150] or 'مشتری'
            p_cur.execute("""
                INSERT INTO addresses (
                    id, customer_id, title, recipient_name, recipient_phone,
                    province, city, postal_address, postal_code, is_default, created_at
                ) VALUES (%s, %s, 'آدرس اصلی', %s, %s, %s, %s, %s, %s, true, %s);
            """, (
                str(uuid.uuid4()), prof_uuid, recip_name, phone,
                province, city, addr_text, postcode, cdata['created_at']
            ))
            imported_addresses_cnt += 1

    print(f"✓ Users & Customer Profiles Imported: {imported_users_cnt}")
    print(f"✓ Addresses Imported: {imported_addresses_cnt}")


    # ─── 3. Migrate Orders & Order Items ──────────────────────────────────────
    print("\n--- Migrating Orders & Order Items ---")

    order_status_map = {
        'wc-deliver': 'delivered',
        'wc-completed': 'delivered',
        'wc-processing': 'processing',
        'wc-pending': 'pending_payment',
        'wc-on-hold': 'pending_payment',
        'wc-cancelled': 'cancelled',
        'wc-refunded': 'refunded',
        'wc-failed': 'cancelled',
        'wc-pws-need-review': 'processing',
        'wc-pws-packaged': 'packed',
    }

    s_cur.execute("""
        SELECT p.ID, p.post_date, p.post_status
        FROM ss_posts p
        WHERE p.post_type='shop_order'
        ORDER BY p.ID ASC;
    """)
    wp_orders = s_cur.fetchall()

    imported_orders_cnt = 0
    imported_order_items_cnt = 0
    used_order_numbers = set()

    for oid, odate, ostatus in wp_orders:
        s_cur.execute("SELECT meta_key, meta_value FROM ss_postmeta WHERE post_id=?", (oid,))
        ometa = dict(s_cur.fetchall())

        order_uuid = str(uuid.uuid4())
        order_num = f"ORD-WP-{oid}"
        if order_num in used_order_numbers:
            order_num = f"ORD-WP-{oid}-{uuid.uuid4().hex[:4]}"
        used_order_numbers.add(order_num)

        raw_phone = ometa.get('_billing_phone')
        norm_phone = normalize_phone(raw_phone)
        customer_uuid = phone_to_user_uuid.get(norm_phone)
        if not customer_uuid and ometa.get('_customer_user'):
            try:
                wp_c_uid = int(ometa['_customer_user'])
                customer_uuid = wp_uid_to_user_uuid.get(wp_c_uid)
            except:
                pass

        status = order_status_map.get(ostatus, 'delivered')

        try:
            total_toman = int(float(ometa.get('_order_total') or 0))
        except:
            total_toman = 0
        total_irr = max(0, total_toman * 10)

        try:
            shipping_toman = int(float(ometa.get('_order_shipping') or 0))
        except:
            shipping_toman = 0
        shipping_irr = max(0, shipping_toman * 10)

        try:
            discount_toman = int(float(ometa.get('_order_discount') or 0))
        except:
            discount_toman = 0
        discount_irr = max(0, discount_toman * 10)

        subtotal_irr = max(0, total_irr - shipping_irr + discount_irr)

        p_cur.execute("""
            INSERT INTO orders (
                id, order_number, customer_id, guest_phone, status,
                subtotal_irr, discount_irr, shipping_fee_irr, total_irr,
                idempotency_key, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            order_uuid, order_num, customer_uuid, norm_phone, status,
            subtotal_irr, discount_irr, shipping_irr, total_irr,
            f"wp-order-{oid}", odate or 'now()'
        ))
        imported_orders_cnt += 1

        s_cur.execute("""
            SELECT order_item_id, order_item_name
            FROM ss_woocommerce_order_items
            WHERE order_id=? AND order_item_type='line_item';
        """, (oid,))
        line_items = s_cur.fetchall()

        for item_id, item_name in line_items:
            s_cur.execute("SELECT meta_key, meta_value FROM ss_woocommerce_order_itemmeta WHERE order_item_id=?", (item_id,))
            imeta = dict(s_cur.fetchall())

            wp_p_id = None
            try:
                wp_p_id = int(imeta.get('_variation_id') or imeta.get('_product_id') or 0)
            except:
                pass

            p_id = wp_product_to_uuid.get(wp_p_id) or fallback_prod_id
            v_id = wp_variant_to_uuid.get(wp_p_id) or fallback_var_id

            try:
                qty = max(1, int(float(imeta.get('_qty') or 1)))
            except:
                qty = 1

            try:
                line_total_toman = int(float(imeta.get('_line_total') or 0))
            except:
                line_total_toman = 0
            line_subtotal_irr = max(0, line_total_toman * 10)
            unit_price_irr = line_subtotal_irr // qty

            p_cur.execute("""
                INSERT INTO order_items (
                    id, order_id, product_id, variant_id,
                    product_title, variant_title, sku,
                    unit_price_irr, quantity, subtotal_irr, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                str(uuid.uuid4()), order_uuid, p_id, v_id,
                (item_name or 'محصول مورینگا')[:250], (item_name or 'محصول مورینگا')[:200], f"WP-ITEM-{item_id}"[:100],
                unit_price_irr, qty, line_subtotal_irr, odate or 'now()'
            ))
            imported_order_items_cnt += 1

    print(f"✓ Orders Imported: {imported_orders_cnt}")
    print(f"✓ Order Line Items Imported: {imported_order_items_cnt}")


    # ─── 4. Migrate Blog Articles & SEO ───────────────────────────────────────
    print("\n--- Migrating Blog Articles & SEO Meta ---")

    art_cat_id = str(uuid.uuid4())
    p_cur.execute("""
        INSERT INTO article_categories (id, name_fa, slug, description_fa, sort_order)
        VALUES (%s, 'آموزش و مقالات تخصصی مورینگا', 'moringa-articles', 'مقالات علمی، خواص و راهنمای مصرف مورینگا اولیفیرا', 1)
        ON CONFLICT (slug) DO UPDATE SET name_fa = EXCLUDED.name_fa
        RETURNING id;
    """, (art_cat_id,))
    art_cat_id = p_cur.fetchone()[0]

    s_cur.execute("""
        SELECT p.ID, p.post_title, p.post_name, p.post_content, p.post_excerpt, p.post_date
        FROM ss_posts p
        WHERE p.post_type='post' AND p.post_status='publish'
        ORDER BY p.ID ASC;
    """)
    articles = s_cur.fetchall()

    imported_articles_cnt = 0
    used_article_slugs = set()
    p_cur.execute("SELECT slug FROM articles;")
    for row in p_cur.fetchall():
        used_article_slugs.add(row[0])

    for aid, atitle, aname, acontent, aexcerpt, adate in articles:
        if not atitle or not acontent:
            continue

        s_cur.execute("SELECT meta_key, meta_value FROM ss_postmeta WHERE post_id=?", (aid,))
        ameta = dict(s_cur.fetchall())

        base_slug = clean_slug(aname)
        slug = base_slug
        idx = 1
        while slug in used_article_slugs:
            slug = f"{base_slug}-{idx}"
            idx += 1
        used_article_slugs.add(slug)

        summary = aexcerpt.strip() if aexcerpt else acontent[:250].strip()
        seo_title = (ameta.get('_yoast_wpseo_title') or atitle)[:250]
        seo_desc = ameta.get('_yoast_wpseo_metadesc') or summary[:300]
        reading_time = max(2, len(acontent.split()) // 150)

        p_cur.execute("""
            INSERT INTO articles (
                id, category_id, author_name_fa, reviewer_name_fa,
                slug, title_fa, summary_fa, content_fa, cover_image_url,
                status, version, forbidden_claim_flagged, disclaimers_fa,
                reading_time_minutes, seo_title, seo_description,
                published_at, created_at, updated_at
            ) VALUES (
                %s, %s, 'تیم علمی ایران مورینگا', 'واحد سلامت و کنترل کیفیت',
                %s, %s, %s, %s, NULL,
                'published', 1, false,
                'اطلاعات و مقالات این سایت صرفاً جنبه آگاهی‌بخشی و آموزشی داشته و نباید به عنوان توصیه پزشکی یا جایگزین نظر پزشک در نظر گرفته شود.',
                %s, %s, %s, %s, %s, %s
            );
        """, (
            str(uuid.uuid4()), art_cat_id,
            slug, atitle[:250], summary, acontent,
            reading_time, seo_title, seo_desc,
            adate or 'now()', adate or 'now()', adate or 'now()'
        ))
        imported_articles_cnt += 1

    print(f"✓ Blog Articles & SEO Meta Imported: {imported_articles_cnt}")


    # ─── 5. Migrate Comments, Product Reviews & Questions ─────────────────────
    print("\n--- Migrating Comments, Reviews & Questions ---")
    s_cur.execute("""
        SELECT c.comment_ID, c.comment_post_ID, p.post_type, p.post_title,
               c.comment_author, c.comment_author_email, c.comment_author_IP,
               c.comment_date, c.comment_content, c.comment_approved, c.comment_type,
               c.comment_parent, c.user_id
        FROM ss_comments c
        JOIN ss_posts p ON c.comment_post_ID = p.ID
        WHERE c.comment_type NOT IN ('order_note', 'pingback')
        ORDER BY c.comment_parent ASC, c.comment_ID ASC;
    """)
    wp_comments_raw = s_cur.fetchall()

    wp_comment_to_uuid = {}
    imported_comments_cnt = 0

    for cid, pid, ptype, ptitle, author, email, ip, cdate, content, approved, ctype, parent, uid in wp_comments_raw:
        if not content or not content.strip():
            continue

        s_cur.execute("SELECT meta_key, meta_value FROM ss_commentmeta WHERE comment_id=?", (cid,))
        cmeta = dict(s_cur.fetchall())

        target_type = 'product' if ptype == 'product' else ('article' if ptype == 'post' else 'page')
        target_id = wp_product_to_uuid.get(pid)

        # If not product, search in articles
        if not target_id and ptype == 'post':
            p_cur.execute("SELECT id FROM articles WHERE title_fa = %s LIMIT 1;", (ptitle[:250],))
            res = p_cur.fetchone()
            if res:
                target_id = res[0]

        parent_uuid = wp_comment_to_uuid.get(parent)
        comment_uuid = str(uuid.uuid4())
        wp_comment_to_uuid[cid] = comment_uuid

        raw_rating = cmeta.get('rating')
        try:
            rating = int(raw_rating) if raw_rating else (5 if ctype == 'review' else None)
            if rating and (rating < 1 or rating > 5):
                rating = 5
        except:
            rating = None

        status = 'approved' if approved in ('1', '۱') else ('pending' if approved in ('0', '۰') else 'rejected')
        is_admin = bool('کامیاب' in (author or '') or 'مدیر' in (author or '') or 'پشتیبانی' in (author or ''))
        is_buyer = bool(cmeta.get('verified') == '1' or target_type == 'product')

        p_cur.execute("""
            INSERT INTO comments (
                id, target_type, target_id, target_title, parent_id,
                author_name, author_email, rating, content, status,
                is_buyer_verified, is_admin_reply, ip_address, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING;
        """, (
            comment_uuid, target_type, target_id, (ptitle or 'دیدگاه کاربران')[:250],
            parent_uuid, (author or 'کاربر مورینگا')[:150], (email or '')[:150] or None,
            rating, content.strip(), status, is_buyer, is_admin, (ip or '')[:45] or None,
            cdate or 'now()', cdate or 'now()'
        ))
        imported_comments_cnt += 1

    print(f"✓ Comments, Reviews & Discussions Imported: {imported_comments_cnt}")

    # Commit the transaction!
    p_conn.commit()
    print("\n==================================================================")
    print("🎉 ALL DATA SUCCESSFULLY COMMITTED TO POSTGRESQL (moringa_dev)!")
    print("==================================================================")

except Exception as e:
    p_conn.rollback()
    print(f"\n❌ FATAL ERROR DURING MIGRATION - TRANSACTION ROLLED BACK: {e}")
    raise e

finally:
    s_conn.close()
    p_conn.close()
