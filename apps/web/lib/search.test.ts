import { normalizeSearchText, performUnifiedSearch } from './search';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runSearchTests() {
  // 1. Normalization
  assert(
    normalizeSearchText('روغن مورينگا خالص') === 'روغن مورینگا خالص',
    'Normalizes Arabic characters'
  );
  assert(
    normalizeSearchText('پودر برگ كپسول') === 'پودر برگ کپسول',
    'Normalizes Kaf character'
  );
  assert(
    normalizeSearchText('پودر ۱۰۰ گرمی') === 'پودر 100 گرمی',
    'Normalizes Persian numerals'
  );
  assert(
    normalizeSearchText('سوپرفود‌ گیاهی!') === 'سوپرفود گیاهی',
    'Strips ZWNJ and punctuation'
  );

  // 2. Product Search
  const prodRes = performUnifiedSearch('روغن پرس سرد');
  assert(prodRes.products.length > 0, 'Finds products by title query');
  assert(prodRes.products[0].item.title_fa.includes('روغن'), 'Top product contains query keyword');

  // 3. Article Search
  const artRes = performUnifiedSearch('دیابت');
  assert(artRes.articles.length > 0, 'Finds articles by keyword');
  assert(
    artRes.articles.some((a) => a.item.title_fa.includes('دیابت') || a.item.summary_fa.includes('دیابت')),
    'Article search matches title or summary'
  );

  // 4. Empty Query
  const emptyRes = performUnifiedSearch('');
  assert(emptyRes.suggestions.length > 0, 'Returns suggestions for empty search');
  assert(emptyRes.totalMatches === 0, 'Total matches is 0 for empty query');

  return true;
}

// Run inline verification
runSearchTests();
