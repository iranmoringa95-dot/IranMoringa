'use client';

import { useState } from 'react';
import { Image as ImageIcon, UploadCloud, X, Check } from 'lucide-react';

interface MediaItem {
  id: string;
  original_name: string;
  public_url: string;
  alt_text_fa: string;
}

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
}

export function MediaSelectorModal({ isOpen, onClose, onSelect }: MediaSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library');
  const [altText, setAltText] = useState('');
  const [titleText, setTitleText] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<MediaItem | null>(null);

  const sampleLibrary: MediaItem[] = [
    {
      id: 'media-01',
      original_name: 'moringa-powder.webp',
      public_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      alt_text_fa: 'پودر ارگانیک برگ مورینگا ۲۵۰ گرمی',
    },
    {
      id: 'media-02',
      original_name: 'moringa-tea.webp',
      public_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      alt_text_fa: 'دمنوش و چای مورینگا ۵۰ گرمی',
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-base">کتابخانه رسانه و تصاویر (Media Library)</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-slate-100 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'library' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            انتخاب از کتابخانه
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'upload' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            آپلود تصویر جدید
          </button>
        </div>

        {activeTab === 'library' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
            {sampleLibrary.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedAsset(item)}
                className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all group ${
                  selectedAsset?.id === item.id ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img src={item.public_url} alt={item.alt_text_fa} className="w-full h-28 object-cover" />
                <div className="p-2 bg-slate-900/60 text-white text-[10px] truncate">{item.alt_text_fa}</div>
                {selectedAsset?.id === item.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3 hover:border-emerald-500 transition-colors cursor-pointer bg-slate-50">
              <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">فایل تصویر را کشیده و اینجا رها کنید (JPEG, PNG, WebP)</p>
              <p className="text-[10px] text-slate-400">حداکثر حجم مجاز: ۵ مگابایت</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                متن جایگزین (Alt Text) به فارسی <span className="text-rose-500">* الزامی</span>
              </label>
              <input
                type="text"
                placeholder="توضیح کوتاه تصویر جهت سئو و دسترس‌پذیری..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium">
            انصراف
          </button>

          <button
            disabled={!selectedAsset}
            onClick={() => {
              if (selectedAsset) {
                onSelect(selectedAsset);
                onClose();
              }
            }}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
          >
            تایید و انتخاب تصویر
          </button>
        </div>
      </div>
    </div>
  );
}
