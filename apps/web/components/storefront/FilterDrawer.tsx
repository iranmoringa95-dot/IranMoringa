'use client';

import { X, Filter, Check } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export function FilterDrawer({
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between z-50 animate-in slide-in-from-right duration-200">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>فیلتر محصولات</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="بستن فیلترها"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">دسته‌بندی‌ها</h4>
            <div className="space-y-1">
              {[
                { slug: '', label: 'همه محصولات' },
                { slug: 'powders', label: 'پودر گیاهی' },
                { slug: 'teas', label: 'دمنوش ارگانیک' },
                { slug: 'oils', label: 'روغن‌های سلامت' },
                { slug: 'seeds', label: 'بذر و نشاء' },
              ].map((item) => (
                <button
                  key={item.slug}
                  onClick={() => {
                    onSelectCategory(item.slug);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    selectedCategory === item.slug
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {selectedCategory === item.slug && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            اعمال فیلترها
          </button>
        </div>
      </div>
    </div>
  );
}
