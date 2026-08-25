import test from 'node:test';
import assert from 'node:assert/strict';

function toPersianDigits(n) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

function formatBadgeNumber(count) {
  if (count === undefined || count === null || count <= 0) return null;
  if (count > 99) return '+۹۹';
  return toPersianDigits(count);
}

function normalizePersianText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\u200c/g, ' ')
    .replace(/[\u200B\u200D\uFEFF]/g, '')
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ةۀ]/g, 'ه')
    .replace(/[آأإ]/g, 'ا')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ی')
    .replace(/[\s\-_]+/g, ' ')
    .trim();
}

function getPersianRoleTitle(role, isSuperAdmin) {
  if (isSuperAdmin || role === 'super_admin') return 'مدیر ارشد';
  switch (role) {
    case 'shop_manager':
      return 'مدیر فروشگاه';
    case 'content_editor':
      return 'کارشناس محتوا';
    case 'logistics_operator':
      return 'مسئول لجستیک و ارسال';
    case 'support_agent':
      return 'کارشناس پشتیبانی';
    default:
      return 'مدیر سیستم';
  }
}

function findActiveRoute(pathname, visibleGroups, visibleFixed) {
  if (!pathname) return { activeItemId: null, activeGroupId: null };

  const allItems = [
    ...visibleFixed.map((it) => ({ item: it, groupId: null })),
  ];

  for (const group of visibleGroups) {
    for (const item of group.items) {
      allItems.push({ item, groupId: group.id });
    }
  }

  let bestMatch = null;

  for (const entry of allItems) {
    const { item, groupId } = entry;
    let score = -1;

    if (item.href === '/admin') {
      if (pathname === '/admin' || pathname === '/admin/') {
        score = 10000;
      }
    } else if (item.exact) {
      if (pathname === item.href || pathname === `${item.href}/`) {
        score = 5000 + item.href.length;
      }
    } else {
      if (pathname === item.href || pathname === `${item.href}/`) {
        score = 5000 + item.href.length;
      } else if (pathname.startsWith(`${item.href}/`)) {
        score = 1000 + item.href.length;
      }
    }

    if (score > (bestMatch?.score ?? -1)) {
      bestMatch = { item, groupId, score };
    }
  }

  if (bestMatch && bestMatch.score > 0) {
    return {
      activeItemId: bestMatch.item.id,
      activeGroupId: bestMatch.groupId,
    };
  }

  return { activeItemId: null, activeGroupId: null };
}

test('normalizePersianText handles Arabic yeh, kaf, half-spaces and case', () => {
  assert.equal(normalizePersianText('دسته\u200cبندی كالا'), 'دسته بندی کالا');
  assert.equal(normalizePersianText('سفارش‌ها و فاكتورها'), 'سفارش ها و فاکتورها');
  assert.equal(normalizePersianText('  گزارش‌های   مالي  '), 'گزارش های مالی');
  assert.equal(normalizePersianText('SMS Pro'), 'sms pro');
});

test('formatBadgeNumber formats numbers properly', () => {
  assert.equal(formatBadgeNumber(0), null);
  assert.equal(formatBadgeNumber(-5), null);
  assert.equal(formatBadgeNumber(null), null);
  assert.equal(formatBadgeNumber(undefined), null);
  assert.equal(formatBadgeNumber(5), '۵');
  assert.equal(formatBadgeNumber(42), '۴۲');
  assert.equal(formatBadgeNumber(99), '۹۹');
  assert.equal(formatBadgeNumber(100), '+۹۹');
  assert.equal(formatBadgeNumber(1250), '+۹۹');
});

test('getPersianRoleTitle maps role correctly', () => {
  assert.equal(getPersianRoleTitle('super_admin', true), 'مدیر ارشد');
  assert.equal(getPersianRoleTitle(undefined, true), 'مدیر ارشد');
  assert.equal(getPersianRoleTitle('shop_manager', false), 'مدیر فروشگاه');
  assert.equal(getPersianRoleTitle('content_editor', false), 'کارشناس محتوا');
  assert.equal(getPersianRoleTitle('logistics_operator', false), 'مسئول لجستیک و ارسال');
  assert.equal(getPersianRoleTitle('support_agent', false), 'کارشناس پشتیبانی');
});

test('findActiveRoute finds the most specific route and group', () => {
  const fixed = [
    { id: 'dashboard', href: '/admin', exact: true },
    { id: 'reports', href: '/admin/reports' },
  ];
  const groups = [
    {
      id: 'catalog',
      title: 'محصولات و انبار',
      items: [
        { id: 'products', href: '/admin/products' },
        { id: 'products-new', href: '/admin/products/new', exact: true },
        { id: 'inventory', href: '/admin/inventory' },
      ],
    },
    {
      id: 'sales',
      title: 'فروش و سفارش‌ها',
      items: [
        { id: 'orders', href: '/admin/orders' },
        { id: 'postchi', href: '/admin/postchi' },
      ],
    },
  ];

  // Root dashboard
  const res1 = findActiveRoute('/admin', groups, fixed);
  assert.equal(res1.activeItemId, 'dashboard');
  assert.equal(res1.activeGroupId, null);

  // Products catalog
  const res2 = findActiveRoute('/admin/products', groups, fixed);
  assert.equal(res2.activeItemId, 'products');
  assert.equal(res2.activeGroupId, 'catalog');

  // Exact products/new (should match products-new, not products)
  const res3 = findActiveRoute('/admin/products/new', groups, fixed);
  assert.equal(res3.activeItemId, 'products-new');
  assert.equal(res3.activeGroupId, 'catalog');

  // Deep edit route (/admin/products/123/edit matches products)
  const res4 = findActiveRoute('/admin/products/123/edit', groups, fixed);
  assert.equal(res4.activeItemId, 'products');
  assert.equal(res4.activeGroupId, 'catalog');

  // Deep order details (/admin/orders/999/timeline matches orders)
  const res5 = findActiveRoute('/admin/orders/999/timeline', groups, fixed);
  assert.equal(res5.activeItemId, 'orders');
  assert.equal(res5.activeGroupId, 'sales');
});
