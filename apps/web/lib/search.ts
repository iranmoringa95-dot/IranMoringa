import { ALL_MORINGA_PRODUCTS, ProductItem } from './products-data';
import { ALL_MORINGA_ARTICLES, ArticleItem } from './articles-data';

// Digits Replacement Map
const digitMap: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

// Arabic to Persian Characters Replacement Map
const charMap: Record<string, string> = {
  'ي': 'ی',
  'ك': 'ک',
  'ة': 'ه',
  'أ': 'ا',
  'إ': 'ا',
  'آ': 'ا',
  'ؤ': 'و',
  'ئ': 'ی',
};

/**
 * Normalizes Persian and Arabic text for robust search matching:
 * - Unifies characters (ي/ك/ة/أ/إ/آ -> ی/ک/ه/ا/و/ی)
 * - Converts Persian & Arabic numerals to ASCII
 * - Removes ZWNJ (Zero-Width Non-Joiner / نیم‌فاصله) & punctuation
 * - Trims and normalizes whitespace
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  let normalized = text.toLowerCase();
  
  // Replace digits
  normalized = normalized.replace(/[۰-۹٠-٩]/g, (w) => digitMap[w] || w);
  
  // Replace Arabic characters
  normalized = normalized.replace(/[يكةأإآؤئ]/g, (w) => charMap[w] || w);
  
  // Remove Zero-Width Non-Joiner (\u200c), Zero-Width Space (\u200b), soft hyphens
  normalized = normalized.replace(/[\u200C\u200B\u00AD\uFEFF]/g, '');
  
  // Replace symbols/punctuation with spaces
  normalized = normalized.replace(/[ـ\-_,\.!?;:،؛\/\\\|\(\)\[\]\{\}'"«»<>]/g, ' ');
  
  // Collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

export interface SearchCategoryResult {
  id: string;
  name_fa: string;
  slug: string;
  type: 'product_category' | 'article_category' | 'topic';
  url: string;
  itemCount?: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'article' | 'category' | 'trending';
  url: string;
}

export interface UnifiedSearchResults {
  query: string;
  products: {
    item: ProductItem;
    score: number;
    highlightField?: string;
  }[];
  articles: {
    item: ArticleItem;
    score: number;
    highlightField?: string;
  }[];
  categories: SearchCategoryResult[];
  suggestions: SearchSuggestion[];
  totalMatches: number;
}

export const POPULAR_SEARCH_TERMS = [
  { text: 'پودر برگ خالص مورینگا', url: '/shop?category=powders' },
  { text: 'روغن پرس سرد مورینگا', url: '/shop?category=oils' },
  { text: 'لاغری و چربی‌سوزی گیاهی', url: '/articles/weight-loss-metabolism' },
  { text: 'کنترل قند خون و دیابت', url: '/articles/diabetes-blood-sugar' },
  { text: 'کپسول و مکمل خوراکی', url: '/shop?category=supplements' },
  { text: 'بذر و نهال اصلاح‌شده', url: '/shop?category=seeds' },
  { text: 'دستورهای اسموتی انرژی‌بخش', url: '/#smoothies' },
  { text: 'پکیج اقتصادی خرید فله', url: '/shop?category=bulk' },
];

export const STATIC_CATEGORIES: SearchCategoryResult[] = [
  { id: 'cat-powders', name_fa: 'پودر برگ مورینگا', slug: 'powders', type: 'product_category', url: '/shop?category=powders', itemCount: 3 },
  { id: 'cat-oils', name_fa: 'روغن‌های درمانی و پوستی خالص', slug: 'oils', type: 'product_category', url: '/shop?category=oils', itemCount: 2 },
  { id: 'cat-teas', name_fa: 'دمنوش و چای کیسه‌ای مورینگا', slug: 'teas', type: 'product_category', url: '/shop?category=teas', itemCount: 1 },
  { id: 'cat-supplements', name_fa: 'مکمل، قرص و کپسول', slug: 'supplements', type: 'product_category', url: '/shop?category=supplements', itemCount: 1 },
  { id: 'cat-bulk', name_fa: 'فله و عمده مزرعه', slug: 'bulk', type: 'product_category', url: '/shop?category=bulk', itemCount: 1 },
  { id: 'cat-seeds', name_fa: 'بذر و نهال اصلاح‌شده', slug: 'seeds', type: 'product_category', url: '/shop?category=seeds', itemCount: 1 },
  { id: 'cat-books', name_fa: 'کتاب و آموزش‌های تخصصی', slug: 'books', type: 'product_category', url: '/shop?category=books', itemCount: 1 },
  { id: 'artcat-about', name_fa: 'دانشنامه مورینگا چیست', slug: 'about-moringa', type: 'article_category', url: '/articles?category=about-moringa', itemCount: 8 },
  { id: 'artcat-growing', name_fa: 'کاشت، زراعت و پرورش', slug: 'growing-moringa', type: 'article_category', url: '/articles?category=growing-moringa', itemCount: 2 },
  { id: 'artcat-health', name_fa: 'خواص درمانی و سلامت', slug: 'health-benefits', type: 'article_category', url: '/articles?category=health-benefits', itemCount: 4 },
];

/**
 * Searches across products, articles, categories and topic guides
 */
export function performUnifiedSearch(query: string): UnifiedSearchResults {
  const cleanQuery = query.trim();
  const normalizedQuery = normalizeSearchText(cleanQuery);

  if (!normalizedQuery) {
    return {
      query: '',
      products: [],
      articles: [],
      categories: [],
      suggestions: POPULAR_SEARCH_TERMS.map((s) => ({
        text: s.text,
        type: 'trending',
        url: s.url,
      })),
      totalMatches: 0,
    };
  }

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);

  // 1. Search Products
  const matchedProducts: { item: ProductItem; score: number; highlightField?: string }[] = [];

  for (const product of ALL_MORINGA_PRODUCTS) {
    const normTitle = normalizeSearchText(product.title_fa);
    const normSubtitle = normalizeSearchText(product.subtitle_fa || '');
    const normDesc = normalizeSearchText(product.description_fa || '');
    const normCat = normalizeSearchText(product.category_name_fa || '');
    const normSku = normalizeSearchText(product.sku || '');
    const normClaims = normalizeSearchText(product.health_claims_fa || '');

    let score = 0;
    let highlightField: string | undefined = undefined;

    // Exact full query match in title
    if (normTitle.includes(normalizedQuery)) {
      score += 150;
      highlightField = product.title_fa;
    } else if (normTitle.replace(/\s+/g, '').includes(normalizedQuery.replace(/\s+/g, ''))) {
      score += 130;
      highlightField = product.title_fa;
    }

    // SKU match
    if (normSku.includes(normalizedQuery)) {
      score += 120;
      highlightField = `کد کالا: ${product.sku}`;
    }

    // Category match
    if (normCat.includes(normalizedQuery)) {
      score += 80;
      if (!highlightField) highlightField = product.category_name_fa;
    }

    // Subtitle match
    if (normSubtitle.includes(normalizedQuery)) {
      score += 70;
      if (!highlightField) highlightField = product.subtitle_fa;
    }

    // Health claims / Description match
    if (normClaims.includes(normalizedQuery)) {
      score += 40;
      if (!highlightField) highlightField = product.health_claims_fa;
    } else if (normDesc.includes(normalizedQuery)) {
      score += 30;
      if (!highlightField) highlightField = product.description_fa;
    }

    // Multi-token partial scoring
    if (queryTokens.length > 1) {
      let tokenMatches = 0;
      for (const token of queryTokens) {
        if (normTitle.includes(token) || normSubtitle.includes(token) || normCat.includes(token) || normClaims.includes(token)) {
          tokenMatches++;
          score += 25;
        }
      }
      if (tokenMatches === queryTokens.length) {
        score += 50; // Bonus if all tokens found
      }
    }

    if (score > 0) {
      matchedProducts.push({ item: product, score, highlightField });
    }
  }

  matchedProducts.sort((a, b) => b.score - a.score);

  // 2. Search Articles
  const matchedArticles: { item: ArticleItem; score: number; highlightField?: string }[] = [];

  for (const article of ALL_MORINGA_ARTICLES) {
    const normTitle = normalizeSearchText(article.title_fa);
    const normSummary = normalizeSearchText(article.summary_fa || '');
    const normCat = normalizeSearchText(article.category_name_fa || '');
    const normContent = normalizeSearchText(article.content_fa || '');
    const normTags = article.tags.map((t) => normalizeSearchText(t)).join(' ');

    let score = 0;
    let highlightField: string | undefined = undefined;

    // Exact full query match in title
    if (normTitle.includes(normalizedQuery)) {
      score += 150;
      highlightField = article.title_fa;
    } else if (normTitle.replace(/\s+/g, '').includes(normalizedQuery.replace(/\s+/g, ''))) {
      score += 130;
      highlightField = article.title_fa;
    }

    // Tag matches
    if (normTags.includes(normalizedQuery)) {
      score += 90;
      const matchedTag = article.tags.find((t) => normalizeSearchText(t).includes(normalizedQuery));
      if (matchedTag) highlightField = `برچسب: #${matchedTag}`;
    }

    // Category match
    if (normCat.includes(normalizedQuery)) {
      score += 70;
      if (!highlightField) highlightField = article.category_name_fa;
    }

    // Summary match
    if (normSummary.includes(normalizedQuery)) {
      score += 60;
      if (!highlightField) highlightField = article.summary_fa;
    }

    // Content match
    if (normContent.includes(normalizedQuery)) {
      score += 30;
      if (!highlightField) highlightField = article.summary_fa;
    }

    // Multi-token partial scoring
    if (queryTokens.length > 1) {
      let tokenMatches = 0;
      for (const token of queryTokens) {
        if (normTitle.includes(token) || normSummary.includes(token) || normTags.includes(token) || normCat.includes(token)) {
          tokenMatches++;
          score += 25;
        }
      }
      if (tokenMatches === queryTokens.length) {
        score += 50; // Bonus if all tokens found
      }
    }

    if (score > 0) {
      matchedArticles.push({ item: article, score, highlightField });
    }
  }

  matchedArticles.sort((a, b) => b.score - a.score);

  // 3. Search Categories & Quick Links
  const matchedCategories = STATIC_CATEGORIES.filter((cat) => {
    const normName = normalizeSearchText(cat.name_fa);
    return normName.includes(normalizedQuery) || queryTokens.some((t) => normName.includes(t));
  });

  // 4. Build Suggestions
  const suggestions: SearchSuggestion[] = [];

  // Add top product suggestions
  for (const p of matchedProducts.slice(0, 3)) {
    suggestions.push({
      text: p.item.title_fa,
      type: 'product',
      url: `/product/${p.item.slug}`,
    });
  }

  // Add top article suggestions
  for (const a of matchedArticles.slice(0, 3)) {
    suggestions.push({
      text: a.item.title_fa,
      type: 'article',
      url: `/articles/${a.item.slug}`,
    });
  }

  const totalMatches = matchedProducts.length + matchedArticles.length + matchedCategories.length;

  return {
    query: cleanQuery,
    products: matchedProducts,
    articles: matchedArticles,
    categories: matchedCategories,
    suggestions,
    totalMatches,
  };
}
