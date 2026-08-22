'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  Layers,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { ALL_MORINGA_PRODUCTS } from '@/lib/products-data';

interface CategoryItem {
  id: string;
  name_fa: string;
  name_en: string;
  slug: string;
  icon: string;
  description_fa: string;
  is_active: boolean;
  color_theme: string;
}

const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1',
    name_fa: 'پودر برگ مورینگا اولیفرا',
    name_en: 'Moringa Leaf Powder',
    slug: 'powders',
    icon: '🍃',
    description_fa: 'پودر ارگانیک خالص سایه‌خشک مناسب اسموتی، دمنوش و مصرف روزانه',
    is_active: true,
    color_theme: '#026251',
  },
  {
    id: 'cat-2',
    name_fa: 'روغن‌های درمانی و خالص',
    name_en: 'Cold-Pressed Moringa Oils',
    slug: 'oils',
    icon: '💧',
    description_fa: 'روغن پرس سرد بذر مورینگا سرشار از بهنیک اسید برای پوست و مو',
    is_active: true,
    color_theme: '#0d9488',
  },
  {
    id: 'cat-3',
    name_fa: 'دمنوش و چای گیاهی مورینگا',
    name_en: 'Moringa Herbal Tea',
    slug: 'teas',
    icon: '☕',
    description_fa: 'ترکیبات آرام‌بخش و آنتی‌اکسیدانی با زنجبیل، نعناع و دارچین',
    is_active: true,
    color_theme: '#15803d',
  },
  {
    id: 'cat-4',
    name_fa: 'مکمل و کپسول‌های خوراکی',
    name_en: 'Moringa Capsules & Supplements',
    slug: 'supplements',
    icon: '💊',
    description_fa: 'کپسول‌های خالص گیاهی استاندارد ۵۰۰ میلی‌گرم بدون افزودنی',
    is_active: true,
    color_theme: '#0369a1',
  },
  {
    id: 'cat-5',
    name_fa: 'فله و عمده (قیمت مزرعه)',
    name_en: 'Bulk & Wholesale Farm Price',
    slug: 'bulk',
    icon: '📦',
    description_fa: 'بسته‌های ۱ و ۵ کیلوگرمی مخصوص فروشگاه‌های سلامت، کارخانجات و عطاری‌ها',
    is_active: true,
    color_theme: '#b45309',
  },
  {
    id: 'cat-6',
    name_fa: 'بذر و نهال اصلاح‌شده',
    name_en: 'Seeds & Seedlings',
    slug: 'seeds',
    icon: '🌱',
    description_fa: 'بذر مرغوب هندی PKM1 اصلاح‌شده با قوه نامیه بالای ۹۰ درصد',
    is_active: true,
    color_theme: '#4d7c0f',
  },
  {
    id: 'cat-7',
    name_fa: 'کتاب و آموزش‌های تخصصی',
    name_en: 'Books & Knowledge Guides',
    slug: 'books',
    icon: '📚',
    description_fa: 'راهنماهای جامع زراعت، پرورش و خواص درمانی مورینگا در ایران',
    is_active: true,
    color_theme: '#6d28d9',
  },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form states
  const [nameFa, setNameFa] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('🌿');
  const [descriptionFa, setDescriptionFa] = useState('');
  const [colorTheme, setColorTheme] = useState('#026251');

  const filtered = categories.filter(
    (c) =>
      c.name_fa.includes(searchQuery) ||
      c.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.includes(searchQuery)
  );

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setNameFa('');
    setNameEn('');
    setSlug('');
    setIcon('🌿');
    setDescriptionFa('');
    setColorTheme('#026251');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setNameFa(cat.name_fa);
    setNameEn(cat.name_en);
    setSlug(cat.slug);
    setIcon(cat.icon);
    setDescriptionFa(cat.description_fa);
    setColorTheme(cat.color_theme);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFa.trim() || !slug.trim()) return;

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                name_fa: nameFa,
                name_en: nameEn,
                slug: slug,
                icon: icon,
                description_fa: descriptionFa,
                color_theme: colorTheme,
              }
            : c
        )
      );
    } else {
      const newCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        name_fa: nameFa,
        name_en: nameEn,
        slug: slug,
        icon: icon,
        description_fa: descriptionFa,
        is_active: true,
        color_theme: colorTheme,
      };
      setCategories((prev) => [...prev, newCat]);
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#08201a] p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-emerald-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-[#026251] dark:text-[#d0de41] flex items-center justify-center font-black">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              مدیریت دسته‌بندی‌ها و طبقه‌بندی کاتالوگ
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              مدیریت عناوین، اسلاگ، آیکون و سازمان‌دهی محصولات فروشگاه
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-[#026251] hover:bg-[#014d3f] text-white rounded-2xl font-bold text-xs transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن دسته‌بندی جدید</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#08201a] p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-emerald-900/40 flex items-center justify-between">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="جستجو در دسته‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-2xl text-xs dark:text-white focus:outline-none focus:border-emerald-600"
          />
        </div>

        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          مجموع: {categories.length} دسته‌بندی
        </span>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((cat) => {
          const productCount = ALL_MORINGA_PRODUCTS.filter(
            (p) => p.category_slug === cat.slug
          ).length;

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-[#08201a] p-6 rounded-3xl border border-slate-200 dark:border-emerald-900/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2.5 bg-slate-50 dark:bg-[#051410] rounded-2xl border border-slate-100 dark:border-emerald-900/40">
                      {cat.icon}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {cat.name_fa}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">{cat.name_en}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-black">
                    {productCount} محصول
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {cat.description_fa}
                </p>

                <div className="text-[11px] text-slate-400 font-mono bg-slate-50 dark:bg-[#051410] p-2 rounded-xl border border-slate-100 dark:border-emerald-900/30">
                  اسلاگ: <span className="text-emerald-700 dark:text-[#d0de41]">/shop?category={cat.slug}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-emerald-950 text-xs">
                <Link
                  href={`/shop?category=${cat.slug}`}
                  target="_blank"
                  className="text-[#026251] dark:text-[#d0de41] font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>مشاهده در فروشگاه</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                    title="ویرایش"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091f18] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 dark:border-emerald-900/60 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    نام فارسی دسته‌بندی *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameFa}
                    onChange={(e) => {
                      setNameFa(e.target.value);
                      if (!slug) {
                        setSlug(e.target.value.trim().toLowerCase().replace(/\s+/g, '-'));
                      }
                    }}
                    placeholder="مثال: دمنوش ارگانیک"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-xl dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    آیکون / ایموجی
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full text-center px-3 py-2.5 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-xl text-lg dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  اسلاگ یکتا انگلیسی (URL Slug) *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="powders, oils, teas..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-xl font-mono text-left dir-ltr dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  توضیحات کوتاه برای سئو و کاتالوگ
                </label>
                <textarea
                  rows={3}
                  value={descriptionFa}
                  onChange={(e) => setDescriptionFa(e.target.value)}
                  placeholder="توضیحاتی در خصوص خواص و محصولات این دسته..."
                  className="w-full p-3 bg-slate-50 dark:bg-[#041410] border border-slate-200 dark:border-emerald-900/60 rounded-xl dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-emerald-950">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#026251] hover:bg-[#024a3d] text-white rounded-xl font-black shadow-md"
                >
                  {editingCategory ? 'به‌روزرسانی دسته‌بندی' : 'ایجاد دسته‌بندی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
