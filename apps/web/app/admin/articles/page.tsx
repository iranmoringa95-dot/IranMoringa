'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Clock, CheckCircle2, AlertTriangle, FileText, History, Send, Eye, ShieldAlert, BookMarked, HelpCircle, Layers, Image as ImageIcon, Heading1, Heading2, Quote, List, ListOrdered, Sparkles, Globe, Search, Tag, UserCheck, ExternalLink } from 'lucide-react';

interface ScientificSource {
  id?: string;
  title: string;
  url?: string;
  publisher?: string;
  year?: number;
}

interface MedicalWarning {
  condition: string;
  warning_text_fa: string;
}

interface ArticleRevision {
  id: string;
  version: number;
  title_fa: string;
  summary_fa: string;
  created_at: string;
}

interface Article {
  id: string;
  category_name_fa: string;
  author_name_fa: string;
  reviewer_name_fa?: string;
  slug: string;
  title_fa: string;
  summary_fa: string;
  content_fa: string;
  cover_image_url?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  tags?: string[];
  status: 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'scheduled' | 'published' | 'archived';
  version: number;
  forbidden_claim_flagged: boolean;
  disclaimers_fa: string;
  medical_warnings?: MedicalWarning[];
  rejection_notes?: string;
  published_at?: string;
  created_at: string;
  sources?: ScientificSource[];
}

interface FAQ {
  id: string;
  question_fa: string;
  answer_fa: string;
  sort_order: number;
}

const API_BASE = '/api/v1';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: 'پیش‌نویس', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_review: { label: 'در حال بازبینی علمی', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  changes_requested: { label: 'نیازمند اصلاح', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'تاییدشده (آماده انتشار)', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  published: { label: 'منتشرشده', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  archived: { label: 'بایگانی', color: 'bg-red-100 text-red-700 border-red-200' },
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'articles' | 'faqs'>('articles');

  // Editor Modal State
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [titleFA, setTitleFA] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryName, setCategoryName] = useState('خواص و کاربردها');
  const [authorName, setAuthorName] = useState('تحریریه علمی سبزینه');
  const [coverImageUrl, setCoverImageUrl] = useState('/images/articles/article-1.png');
  const [summaryFA, setSummaryFA] = useState('');
  const [contentFA, setContentFA] = useState('');
  const [disclaimerFA, setDisclaimerFA] = useState('اطلاعات ارائه شده در این مقاله صرفاً جنبه آگاهی‌بخشی عمومی داشته و جایگزین توصیه، تشخیص یا درمان مستقیم پزشک متخصص نیست.');
  const [tagsInput, setTagsInput] = useState('مورینگا, سلامت, تغذیه');
  
  // SEO Meta State
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  
  // Scientific Sources
  const [sources, setSources] = useState<ScientificSource[]>([]);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceURL, setNewSourceURL] = useState('');
  const [saving, setSaving] = useState(false);

  // Review Modal State
  const [reviewingArticle, setReviewingArticle] = useState<Article | null>(null);
  const [reviewerName, setReviewerName] = useState('دکتر محمد حسینی (متخصص تغذیه)');
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Revisions Modal State
  const [viewingRevisionsArticle, setViewingRevisionsArticle] = useState<Article | null>(null);
  const [revisions, setRevisions] = useState<ArticleRevision[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/articles`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFAQs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/content/faqs`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.faqs || []);
      }
    } catch {
      // Silently handle error
    }
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchFAQs();
  }, [fetchArticles, fetchFAQs]);

  const handleOpenEditor = (art?: Article) => {
    setEditorMode('edit');
    if (art) {
      setEditingArticle(art);
      setTitleFA(art.title_fa);
      setSlug(art.slug);
      setCategoryName(art.category_name_fa || 'خواص و کاربردها');
      setAuthorName(art.author_name_fa || 'تحریریه علمی سبزینه');
      setCoverImageUrl(art.cover_image_url || '/images/articles/article-1.png');
      setSummaryFA(art.summary_fa);
      setContentFA(art.content_fa);
      setDisclaimerFA(art.disclaimers_fa);
      setTagsInput((art.tags || []).join(', '));
      setSeoTitle(art.seo_title || '');
      setSeoDescription(art.seo_description || '');
      setCanonicalUrl(art.canonical_url || '');
      setSources(art.sources || []);
    } else {
      setEditingArticle(null);
      setTitleFA('');
      setSlug('');
      setCategoryName('خواص و کاربردها');
      setAuthorName('تحریریه علمی سبزینه');
      setCoverImageUrl('/images/articles/article-1.png');
      setSummaryFA('');
      setContentFA('');
      setDisclaimerFA('اطلاعات ارائه شده در این مقاله صرفاً جنبه آگاهی‌بخشی عمومی داشته و جایگزین توصیه، تشخیص یا درمان مستقیم پزشک متخصص نیست.');
      setTagsInput('مورینگا, سلامت, تغذیه');
      setSeoTitle('');
      setSeoDescription('');
      setCanonicalUrl('');
      setSources([]);
    }
    setShowEditorModal(true);
  };

  const handleInsertFormat = (formatType: string) => {
    let snippet = '';
    switch (formatType) {
      case 'h2':
        snippet = '\n\n## عنوان بخش جدید\nمتن این بخش را اینجا بنویسید...\n';
        break;
      case 'h3':
        snippet = '\n\n### زیرعنوان موضوعی\nتوضیحات تکمیلی...\n';
        break;
      case 'quote':
        snippet = '\n\n> «نقل‌قول یا نکته مهم کلیدی مقاله را اینجا درج کنید.»\n';
        break;
      case 'list':
        snippet = '\n\n- مورد اول\n- مورد دوم\n- مورد سوم\n';
        break;
      case 'ordered':
        snippet = '\n\n1. مرحله اول\n2. مرحله دوم\n3. مرحله سوم\n';
        break;
      case 'image':
        snippet = '\n\n![تصویر توضیحی](/images/articles/article-2.png)\n';
        break;
      default:
        break;
    }
    setContentFA((prev) => prev + snippet);
  };

  const handleAddSource = () => {
    if (!newSourceTitle.trim()) return;
    setSources([...sources, { title: newSourceTitle, url: newSourceURL, year: 2024 }]);
    setNewSourceTitle('');
    setNewSourceURL('');
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const endpoint = editingArticle
        ? `${API_BASE}/admin/articles/${editingArticle.id}`
        : `${API_BASE}/admin/articles`;
      const method = editingArticle ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title_fa: titleFA,
          slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
          category_name_fa: categoryName,
          author_name_fa: authorName,
          cover_image_url: coverImageUrl,
          summary_fa: summaryFA,
          content_fa: contentFA,
          disclaimers_fa: disclaimerFA,
          seo_title: seoTitle || titleFA,
          seo_description: seoDescription || summaryFA,
          canonical_url: canonicalUrl,
          tags: parsedTags,
          sources,
        }),
      });

      if (res.ok) {
        alert(editingArticle ? 'مقاله با موفقیت به‌روزرسانی شد.' : 'پیش‌نویس مقاله جدید با موفقیت ایجاد گردید.');
        setShowEditorModal(false);
        fetchArticles();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در ذخیره مقاله.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/articles/${id}/submit-review`, { method: 'POST' });
      if (res.ok) {
        alert('مقاله جهت بازبینی علمی ارسال شد.');
        fetchArticles();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در ارسال برای بازبینی.');
    }
  };

  const handleReviewArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingArticle) return;

    setReviewing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/articles/${reviewingArticle.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_name: reviewerName,
          approved: reviewDecision === 'approve',
          notes: reviewNotes,
        }),
      });

      if (res.ok) {
        alert(reviewDecision === 'approve' ? 'مقاله توسط بازبین علمی تایید شد.' : 'درخواست اصلاحات به نویسنده ارسال شد.');
        setReviewingArticle(null);
        fetchArticles();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در ثبت نتیجه بازبینی.');
    } finally {
      setReviewing(false);
    }
  };

  const handleUnpublishArticle = async (id: string) => {
    if (!confirm('آیا از تغییر وضعیت مقاله به پیش‌نویس (لغو انتشار) اطمینان دارید؟')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/articles/${id}/unpublish`, { method: 'POST' });
      if (res.ok) {
        alert('مقاله با موفقیت به حالت پیش‌نویس بازگشت.');
        fetchArticles();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در لغو انتشار مقاله.');
    }
  };

  const handleArchiveArticle = async (id: string) => {
    if (!confirm('آیا از بایگانی کردن این مقاله اطمینان دارید؟')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/articles/${id}/archive`, { method: 'POST' });
      if (res.ok) {
        alert('مقاله با موفقیت بایگانی شد.');
        fetchArticles();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در بایگانی مقاله.');
    }
  };

  const handlePublishArticle = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/articles/${id}/publish`, { method: 'POST' });
      if (res.ok) {
        alert('مقاله با موفقیت بر روی وب‌سایت منتشر شد.');
        fetchArticles();
      } else {
        const data = await res.json();
        alert(`دروازه انتشار (Publication Gate): ${data.detail}`);
      }
    } catch {
      alert('خطا در انتشار مقاله.');
    }
  };

  const handleOpenRevisions = async (art: Article) => {
    setViewingRevisionsArticle(art);
    setRevisionsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/articles/${art.id}/revisions`);
      if (res.ok) {
        const data = await res.json();
        setRevisions(data.revisions || []);
      }
    } catch {
      setRevisions([]);
    } finally {
      setRevisionsLoading(false);
    }
  };

  const handleRestoreRevision = async (articleId: string, revId: string) => {
    if (!confirm('آیا از بازگردانی این نسخه اطمینان دارید؟ نسخه جدید ایجاد خواهد شد.')) return;

    try {
      const res = await fetch(`${API_BASE}/admin/articles/${articleId}/revisions/${revId}/restore`, { method: 'POST' });
      if (res.ok) {
        alert('نسخه مقاله با موفقیت بازگردانی شد.');
        setViewingRevisionsArticle(null);
        fetchArticles();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در بازگردانی نسخه.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">مدیریت محتوا، مقالات و سئو</h1>
          <p className="text-xs text-slate-500">ویرایشگر پیشرفته مقالات، کنترل متاتگ‌های سئو، منابع علمی و گردش‌کار بازبینی سلامت</p>
        </div>
        <button
          onClick={() => handleOpenEditor()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs self-start"
        >
          <Plus className="w-4 h-4" />
          <span>نگارش مقاله جدید</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'articles'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          مقالات و سلامت ({articles.length.toLocaleString('fa-IR')})
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'faqs'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          سوالات متداول (FAQ) ({faqs.length.toLocaleString('fa-IR')})
        </button>
      </div>

      {/* ── Articles Tab ── */}
      {activeTab === 'articles' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <Clock className="w-6 h-6 mx-auto mb-2 animate-pulse" />
              در حال بارگذاری مقالات...
            </div>
          ) : articles.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <BookOpen className="w-8 h-8 mx-auto mb-2" />
              هیچ مقاله‌ای یافت نشد
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">عنوان مقاله</th>
                  <th className="p-3.5">دسته‌بندی</th>
                  <th className="p-3.5">بازبین علمی</th>
                  <th className="p-3.5">نسخه</th>
                  <th className="p-3.5">هشدار سلامت</th>
                  <th className="p-3.5">وضعیت انتشار</th>
                  <th className="p-3.5">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((art) => {
                  const statusInfo = STATUS_MAP[art.status] || { label: art.status, color: 'bg-slate-100 text-slate-700' };
                  return (
                    <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-slate-900 truncate" title={art.title_fa}>{art.title_fa}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal dir-ltr text-right">{art.slug}</div>
                      </td>
                      <td className="p-3.5 text-slate-700">{art.category_name_fa}</td>
                      <td className="p-3.5 text-slate-700">{art.reviewer_name_fa || '—'}</td>
                      <td className="p-3.5 font-mono text-slate-600">v{art.version}</td>
                      <td className="p-3.5">
                        {art.forbidden_claim_flagged ? (
                          <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            پرچم ادعای درمانی
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">تایید اولیه</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleOpenEditor(art)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                          >
                            ویرایش و سئو
                          </button>

                          <Link
                            href={`/articles/${art.slug}`}
                            target="_blank"
                            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg font-semibold transition-colors flex items-center gap-1"
                            title="مشاهده صفحه در سایت"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {art.status === 'draft' && (
                            <button
                              onClick={() => handleSubmitForReview(art.id)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold transition-colors flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              ارسال بازبینی
                            </button>
                          )}

                          {(art.status === 'approved' || art.status === 'draft') && (
                            <button
                              onClick={() => handlePublishArticle(art.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors shadow-xs"
                            >
                              انتشار
                            </button>
                          )}

                          {art.status === 'published' && (
                            <button
                              onClick={() => handleUnpublishArticle(art.id)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-semibold transition-colors"
                            >
                              لغو انتشار
                            </button>
                          )}

                          {art.status !== 'archived' && (
                            <button
                              onClick={() => handleArchiveArticle(art.id)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold transition-colors"
                            >
                              بایگانی
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenRevisions(art)}
                            className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                            title="تاریخچه نسخه"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── FAQs Tab ── */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">لیست سوالات متداول (FAQ)</h3>
            <div className="divide-y divide-slate-100">
              {faqs.map((f) => (
                <div key={f.id} className="py-3 space-y-1 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    <span>{f.question_fa}</span>
                  </div>
                  <p className="text-slate-600 mr-6">{f.answer_fa}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Advanced Editor & SEO Modal ── */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl max-w-4xl w-full space-y-5 max-h-[92vh] overflow-y-auto animate-in fade-in duration-200">
            {/* Modal Header with Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {editingArticle ? `ویرایش مقاله «${editingArticle.title_fa}» (نسخه v${editingArticle.version})` : 'نگارش و سئوی مقاله جدید'}
                </h3>
                <p className="text-xs text-slate-500">محتوای غنی، تنظیمات تصویر، منابع علمی و پیکربندی متاتگ‌های سئو</p>
              </div>

              {/* Edit / Preview Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start">
                <button
                  type="button"
                  onClick={() => setEditorMode('edit')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    editorMode === 'edit' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ویرایشگر متن
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('preview')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                    editorMode === 'preview' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>پیش‌نمایش زنده</span>
                </button>
              </div>
            </div>

            {editorMode === 'preview' ? (
              /* Live Preview Mode */
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6 max-h-[65vh] overflow-y-auto">
                <div className="space-y-3">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">
                    {categoryName}
                  </span>
                  <h1 className="text-2xl font-black text-slate-900 leading-tight">
                    {titleFA || 'عنوان پیش‌نمایش مقاله'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed font-medium">
                    {summaryFA || 'خلاصه مقاله در اینجا نمایش داده می‌شود...'}
                  </p>
                </div>

                {coverImageUrl && (
                  <div className="h-64 rounded-2xl overflow-hidden border border-slate-200">
                    <img src={coverImageUrl} alt="کاور" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="prose prose-slate max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed space-y-3 whitespace-pre-line">
                  {contentFA || 'متن مقاله را بنویسید...'}
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-xs">
                  <span className="font-bold block mb-1">هشدار پزشکی:</span>
                  {disclaimerFA}
                </div>
              </div>
            ) : (
              /* Form Edit Mode */
              <form onSubmit={handleSaveArticle} className="space-y-5 text-xs">
                {/* Basic Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">عنوان فارسی مقاله *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثلاً خواص شگفت‌انگیز روغن مورینگا برای پوست"
                      value={titleFA}
                      onChange={(e) => setTitleFA(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">اسلاگ URL (انگلیسی یکتا) *</label>
                    <input
                      type="text"
                      required
                      placeholder="moringa-skin-benefits"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-left dir-ltr focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">دسته‌بندی موضوعی</label>
                    <select
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      <option value="خواص و کاربردها">خواص و کاربردها</option>
                      <option value="پوست و مو">پوست و مو</option>
                      <option value="راهنمای مصرف">راهنمای مصرف</option>
                      <option value="سلامت عمومی">سلامت عمومی</option>
                      <option value="کشاورزی و کشت">کشاورزی و کشت</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">نام نویسنده</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Cover Image URL with Live Thumbnail */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>آدرس تصویر شاخص (کاور مقاله)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">مسیر داخلی یا URL آنلاین</span>
                  </div>

                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder="/images/articles/article-1.png"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      className="flex-1 p-2.5 border border-slate-300 rounded-xl font-mono text-left dir-ltr text-xs bg-white"
                    />
                    {coverImageUrl && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white">
                        <img src={coverImageUrl} alt="پیش‌نمایش کاور" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Field */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">چکیده / خلاصه مقدمه مقاله *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="خلاصه جذاب و موجز برای نمایش در کارت‌ها و پیش‌نمایش شبکه‌های اجتماعی..."
                    value={summaryFA}
                    onChange={(e) => setSummaryFA(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Content Field with Quick Formatting Toolbar */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="font-bold text-slate-700">متن کامل مقاله (با پشتیبانی از فرمت‌بندی Markdown) *</label>
                    
                    {/* Quick Format Toolbar */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('h2')}
                        className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded shadow-xs"
                        title="افزودن سرتیتر بخش"
                      >
                        H2 سرتیتر
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('h3')}
                        className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded shadow-xs"
                        title="افزودن زیرعنوان"
                      >
                        H3 زیرعنوان
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('quote')}
                        className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded shadow-xs"
                        title="افزودن نقل‌قول برجسته"
                      >
                        نقل‌قول
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('list')}
                        className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded shadow-xs"
                        title="افزودن لیست بالت‌پوینت"
                      >
                        لیست
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('image')}
                        className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded shadow-xs"
                        title="افزودن تصویر در متن"
                      >
                        تصویر
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={10}
                    required
                    placeholder="متن کامل مقاله را بنویسید. برای ساخت تیترها از ## و برای لیست از - استفاده فرمایید..."
                    value={contentFA}
                    onChange={(e) => setContentFA(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-mono text-xs leading-relaxed"
                  />
                </div>

                {/* SEO Optimization Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900">پیکربندی سئو و متاتگ‌های موتورهای جستجو (SEO)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <label className="font-bold text-slate-700">عنوان سئو در گوگل (SEO Title)</label>
                        <span className="text-slate-400">{seoTitle.length} / ۶۰ حرف</span>
                      </div>
                      <input
                        type="text"
                        placeholder={titleFA || 'عنوان بهینه‌شده برای جستجو'}
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">آدرس کنونیکال (Canonical URL)</label>
                      <input
                        type="text"
                        placeholder="https://moringalab.ir/articles/..."
                        value={canonicalUrl}
                        onChange={(e) => setCanonicalUrl(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs font-mono text-left dir-ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <label className="font-bold text-slate-700">توضیحات متا برای نتایج گوگل (Meta Description)</label>
                      <span className="text-slate-400">{seoDescription.length} / ۱۶۰ حرف</span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder={summaryFA || 'توضیحات متای بهینه‌شده جهت افزایش نرخ کلیک (CTR)...'}
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">برچسب‌ها و کلمات کلیدی (با کاما جدا کنید)</label>
                    <input
                      type="text"
                      placeholder="روغن مورینگا, پوست و مو, خواص درمانی"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Health Disclaimer Field */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">هشدار و سلب مسئولیت عمومی پزشکی (Disclaimer)</label>
                  <textarea
                    rows={2}
                    required
                    value={disclaimerFA}
                    onChange={(e) => setDisclaimerFA(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 text-[11px]"
                  />
                </div>

                {/* Scientific Sources Section */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                  <label className="block font-bold text-slate-900">منابع و مراجع علمی معتبر (Scientific Sources)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="عنوان مرجع/ژورنال علمی (مثلاً Phytotherapy Research 2023)"
                      value={newSourceTitle}
                      onChange={(e) => setNewSourceTitle(e.target.value)}
                      className="flex-1 p-2 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="لینک/DOI (https://...)"
                      value={newSourceURL}
                      onChange={(e) => setNewSourceURL(e.target.value)}
                      className="flex-1 p-2 border border-slate-300 rounded-xl font-mono text-left dir-ltr text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddSource}
                      className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shrink-0"
                    >
                      افزودن منبع
                    </button>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {sources.map((src, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-slate-800">{src.title}</span>
                        <span className="font-mono text-slate-400 dir-ltr text-right">{src.url}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Action Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditorModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {saving ? 'در حال ذخیره‌سازی...' : editingArticle ? 'ذخیره تغییرات مقاله' : 'ایجاد پیش‌نویس مقاله'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Review Approval Modal ── */}
      {reviewingArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">بازبینی علمی مقاله سلامت</h3>
            <form onSubmit={handleReviewArticleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">نام بازبین علمی (پزشک/داروساز)</label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">تصمیم بازبینی</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="approve">تایید علمی (آماده برای انتشار)</option>
                  <option value="reject">درخواست اصلاحات و ویرایش متن</option>
                </select>
              </div>

              {reviewDecision === 'reject' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">توضیحات اصلاحات لازم</label>
                  <textarea
                    rows={3}
                    required
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="موارد نیازمند اصلاح علمی توسط نویسنده..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingArticle(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700"
                >
                  ثبت نتیجه بازبینی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Revisions Modal ── */}
      {viewingRevisionsArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl max-w-lg w-full space-y-4 max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-base">
              تاریخچه نسخه‌های مقاله «{viewingRevisionsArticle.title_fa}»
            </h3>
            {revisionsLoading ? (
              <p className="text-xs text-slate-400 text-center py-6">در حال بارگذاری نسخه‌ها...</p>
            ) : (
              <div className="space-y-3">
                {revisions.map((rev) => (
                  <div key={rev.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>نسخه v{rev.version}</span>
                      <span className="text-[10px] text-slate-400">{new Date(rev.created_at).toLocaleString('fa-IR')}</span>
                    </div>
                    <p className="text-slate-700 font-semibold">{rev.title_fa}</p>
                    <p className="text-slate-500 text-[11px] truncate">{rev.summary_fa}</p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleRestoreRevision(viewingRevisionsArticle.id, rev.id)}
                        className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700"
                      >
                        بازگردانی به این نسخه
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingRevisionsArticle(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs rounded-xl font-semibold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
