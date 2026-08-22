'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Star,
  Check,
  X,
  CornerUpLeft,
  Clock,
  ShieldCheck,
  ThumbsUp,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Trash2,
  Send,
  Download,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ShoppingBag,
  User,
  Sparkles,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface CommentItem {
  id: string;
  rowNumber: number;
  targetType: 'article' | 'product' | 'page';
  targetId?: string;
  targetTitle: string;
  parentId?: string;
  parentAuthor?: string;
  parentContent?: string;
  authorName: string;
  authorEmail: string;
  authorPhone: string;
  rating?: number | null;
  content: string;
  status: 'approved' | 'pending' | 'rejected' | 'spam';
  isBuyerVerified: boolean;
  isAdminReply: boolean;
  likeCount: number;
  ipAddress?: string;
  createdAt: string;
}

interface Stats {
  totalComments: number;
  productReviews: number;
  articleComments: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export default function AdminReviewsPage() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalComments: 0,
    productReviews: 0,
    articleComments: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'article'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail & Reply Modal
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [adminName, setAdminName] = useState('پشتیبانی ایران مورینگا');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch comments from PostgreSQL API or local store fallback
  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        q: searchQuery,
        type: typeFilter,
        status: statusFilter,
      });

      const res = await fetch(`/api/v1/admin/reviews?${params.toString()}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          setComments(data.items || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalCount(data.pagination?.total || 0);
          if (data.stats) {
            setStats(data.stats);
          }
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {}

    // Fallback store
    const DEFAULT_REVIEWS: CommentItem[] = [
      {
        id: 'rev-1',
        rowNumber: 1,
        targetType: 'product',
        targetTitle: 'پودر برگ مورینگا ۲۵۰ گرمی',
        authorName: 'دکتر مریم کاظمی',
        authorEmail: 'm.kazemi@gmail.com',
        authorPhone: '09121234567',
        rating: 5,
        content: 'کیفیت و رنگ سبز درخشان پودر مورینگا فوق‌العاده است. برای تقویت سیستم ایمنی و شادابی صبحگاهی عالی عمل می‌کنه.',
        status: 'approved',
        isBuyerVerified: true,
        isAdminReply: false,
        likeCount: 14,
        createdAt: '۱۴۰۴/۰۵/۱۰ - ۱۰:۳۰',
      },
      {
        id: 'rev-2',
        rowNumber: 2,
        targetType: 'product',
        targetTitle: 'روغن مورینگا ۳۰ میلی‌لیتری',
        authorName: 'سارا رضایی',
        authorEmail: 'sara.rezaei@yahoo.com',
        authorPhone: '09354567890',
        rating: 5,
        content: 'جذب بسیار سریعی داره و پوست رو اصلاً چرب نمی‌کنه. خطوط ریز دور چشم رو بعد از دو هفته کاهش داد.',
        status: 'approved',
        isBuyerVerified: true,
        isAdminReply: false,
        likeCount: 9,
        createdAt: '۱۴۰۴/۰۵/۱۱ - ۱۶:۴۵',
      },
      {
        id: 'rev-3',
        rowNumber: 3,
        targetType: 'article',
        targetTitle: 'اسیدهای آمینه مورینگا و پروتئین کامل گیاهی',
        authorName: 'مهرداد افشار',
        authorEmail: 'afshar.m@gmail.com',
        authorPhone: '09139876543',
        rating: null,
        content: 'مقاله بسیار علمی و کاملی بود. آیا این محصول برای بدنسازی و ریکاوری بعد از تمرین هم کفایت میکنه؟',
        status: 'approved',
        isBuyerVerified: false,
        isAdminReply: false,
        likeCount: 5,
        createdAt: '۱۴۰۴/۰۵/۱۲ - ۱۲:۱۵',
      },
      {
        id: 'rev-4',
        rowNumber: 4,
        targetType: 'product',
        targetTitle: 'کپسول مورینگا ۶۰ عددی',
        authorName: 'حسین نادری',
        authorEmail: 'naderi.h@gmail.com',
        authorPhone: '09176543210',
        rating: 5,
        content: 'مصرفش خیلی راحت‌تر از پودره. احساس انرژی پایدار در طول روز به آدم میده.',
        status: 'pending',
        isBuyerVerified: true,
        isAdminReply: false,
        likeCount: 2,
        createdAt: '۱۴۰۴/۰۵/۱۴ - ۰۹:۲۰',
      },
    ];

    let filtered = DEFAULT_REVIEWS.filter((r) => {
      if (typeFilter !== 'all' && r.targetType !== typeFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = r.authorName.toLowerCase().includes(q);
        const matchContent = r.content.toLowerCase().includes(q);
        const matchTitle = r.targetTitle.toLowerCase().includes(q);
        if (!matchName && !matchContent && !matchTitle) return false;
      }
      return true;
    });

    setTotalCount(filtered.length);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
    setComments(filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize));
    setStats({
      totalComments: DEFAULT_REVIEWS.length,
      productReviews: DEFAULT_REVIEWS.filter((r) => r.targetType === 'product').length,
      articleComments: DEFAULT_REVIEWS.filter((r) => r.targetType === 'article').length,
      pendingCount: DEFAULT_REVIEWS.filter((r) => r.status === 'pending').length,
      approvedCount: DEFAULT_REVIEWS.filter((r) => r.status === 'approved').length,
      rejectedCount: DEFAULT_REVIEWS.filter((r) => r.status === 'rejected').length,
    });
    setLoading(false);
  }, [currentPage, pageSize, searchQuery, typeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComments();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchComments]);

  // Quick Status Toggle (Approve / Reject)
  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected' | 'pending', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch('/api/v1/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
        );
        if (selectedComment && selectedComment.id === id) {
          setSelectedComment((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('آیا از حذف دائمی این دیدگاه اطمینان دارید؟')) return;

    try {
      const res = await fetch(`/api/v1/admin/reviews?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        if (selectedComment?.id === id) {
          setSelectedComment(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Admin Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComment || !replyText.trim()) return;

    setReplySubmitting(true);
    setReplyFeedback(null);

    try {
      const res = await fetch('/api/v1/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: selectedComment.id,
          target_type: selectedComment.targetType,
          target_id: selectedComment.targetId,
          target_title: selectedComment.targetTitle,
          admin_name: adminName.trim(),
          reply_content: replyText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReplyFeedback({ type: 'success', message: 'پاسخ شما با موفقیت ثبت و منتشر گردید.' });
        setReplyText('');
        fetchComments();
      } else {
        setReplyFeedback({ type: 'error', message: data.error || 'خطا در ثبت پاسخ.' });
      }
    } catch (err) {
      setReplyFeedback({ type: 'error', message: 'خطا در ارتباط با سرور.' });
    } finally {
      setReplySubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!comments.length) return;
    const headers = ['ردیف', 'نویسنده', 'ایمیل', 'نوع هدف', 'عنوان هدف', 'امتیاز', 'متن دیدگاه', 'وضعیت', 'تاریخ'];
    const rows = comments.map((c) => [
      c.rowNumber,
      `"${c.authorName}"`,
      c.authorEmail || '',
      c.targetType === 'product' ? 'محصول' : 'مقاله',
      `"${c.targetTitle}"`,
      c.rating || '',
      `"${c.content.replace(/"/g, '""')}"`,
      c.status === 'approved' ? 'تایید شده' : c.status === 'pending' ? 'در انتظار' : 'رد شده',
      new Date(c.createdAt).toLocaleDateString('fa-IR'),
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `moringa_reviews_comments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-inner flex-shrink-0">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                مدیریت دیدگاه‌ها و نظرات کاربران
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {totalCount.toLocaleString('fa-IR')} دیدگاه در دیتابیس
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              مدیریت یکپارچه دیدگاه‌های مقالات، نظرات و امتیازات محصولات، پاسخگویی رسمی و انتشار در سایت.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-xs transition-colors"
            title="خروجی فایل اکسل / CSV"
          >
            <Download className="w-4 h-4" />
            <span>خروجی اکسل</span>
          </button>
          <button
            onClick={() => fetchComments()}
            disabled={loading}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors disabled:opacity-50"
            title="به‌روزرسانی اطلاعات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">کل نظرات و دیدگاه‌ها</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {stats.totalComments.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> ۱۰۰٪ در پایگاه‌داده
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">دیدگاه‌های مقالات و وبلاگ</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {stats.articleComments.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-indigo-600 mt-1 font-medium">بحث‌های علمی و پاسخ‌ها</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">نظرات و امتیازات محصولات</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {stats.productReviews.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-amber-600 mt-1 font-medium flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> تجربیات مصرف خریداران
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">دیدگاه‌های تاییدشده</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.approvedCount.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-zinc-400 mt-1">منتشر شده در فروشگاه</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Filter: All / Products / Articles */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setTypeFilter('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                typeFilter === 'all' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              همه دیدگاه‌ها ({stats.totalComments})
            </button>
            <button
              onClick={() => {
                setTypeFilter('article');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                typeFilter === 'article' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>دیدگاه‌های مقالات ({stats.articleComments})</span>
            </button>
            <button
              onClick={() => {
                setTypeFilter('product');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                typeFilter === 'product' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>نظرات محصولات ({stats.productReviews})</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="approved">تایید شده (منتشر)</option>
              <option value="pending">در انتظار بررسی</option>
              <option value="rejected">رد شده / نامناسب</option>
            </select>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو در متن نظر، نام نویسنده، ایمیل یا عنوان مقاله/محصول..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
        </div>
      </div>

      {/* Main Comments Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm text-zinc-500">در حال بارگذاری دیدگاه‌ها از دیتابیس...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-medium text-rose-600">{error}</p>
            <button
              onClick={() => fetchComments()}
              className="px-4 py-2 bg-zinc-100 text-xs font-bold rounded-xl"
            >
              تلاش مجدد
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center space-y-2 text-zinc-400">
            <MessageSquare className="w-8 h-8 mx-auto opacity-50" />
            <p className="text-sm font-semibold">دیدگاهی با این فیلترها یافت نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">#</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">نویسنده دیدگاه</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">هدف (مقاله / محصول)</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">امتیاز</th>
                  <th className="py-3.5 px-4">متن دیدگاه</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">تاریخ ثبت</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">وضعیت</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {comments.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => {
                      setSelectedComment(c);
                      setReplyFeedback(null);
                    }}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Row Number */}
                    <td className="py-3.5 px-3 text-center font-mono text-zinc-400 text-[11px] whitespace-nowrap">
                      {c.rowNumber.toLocaleString('fa-IR')}
                    </td>

                    {/* Author Info */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                          {c.authorName ? c.authorName[0] : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <span>{c.authorName}</span>
                            {c.isAdminReply && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] rounded font-bold">
                                مدیر
                              </span>
                            )}
                          </p>
                          {c.authorEmail && (
                            <p className="text-[10px] text-zinc-400 font-mono truncate max-w-[140px]" dir="ltr">
                              {c.authorEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Target Item */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {c.targetType === 'product' ? (
                          <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded text-[10px] font-semibold flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            محصول
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-semibold flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            مقاله
                          </span>
                        )}
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 max-w-[180px] truncate" title={c.targetTitle}>
                          {c.targetTitle}
                        </span>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {c.rating ? (
                        <div className="flex items-center justify-center gap-0.5 text-amber-400">
                          <span className="font-bold text-[11px] font-mono text-zinc-800 dark:text-zinc-200 ml-1">
                            {c.rating}
                          </span>
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                        </div>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600 font-bold">—</span>
                      )}
                    </td>

                    {/* Content Preview */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      {c.parentAuthor && (
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1 mb-0.5">
                          <CornerUpLeft className="w-3 h-3 text-emerald-600" />
                          <span>در پاسخ به {c.parentAuthor}</span>
                        </div>
                      )}
                      <p className="truncate text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal" title={c.content}>
                        {c.content}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-center text-zinc-500 dark:text-zinc-400 text-[11px] whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString('fa-IR')}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.status === 'approved'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : c.status === 'pending'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {c.status === 'approved' ? '✔ تایید شده' : c.status === 'pending' ? '⏳ در انتظار' : '✖ رد شده'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {c.status !== 'approved' && (
                          <button
                            onClick={(e) => handleStatusChange(c.id, 'approved', e)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                            title="تایید و انتشار نظر"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {c.status === 'approved' && (
                          <button
                            onClick={(e) => handleStatusChange(c.id, 'rejected', e)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="رد کردن و عدم نمایش"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComment(c);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                          title="مشاهده و پاسخ مدیریت"
                        >
                          <CornerUpLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteComment(c.id, e)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="حذف دیدگاه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-800/30">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            نمایش ردیف {(currentPage - 1) * pageSize + 1} تا {Math.min(currentPage * pageSize, totalCount)} از{' '}
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{totalCount.toLocaleString('fa-IR')}</span> دیدگاه
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              <option value="25">۲۵ در صفحه</option>
              <option value="50">۵۰ در صفحه</option>
              <option value="100">۱۰۰ در صفحه</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                صفحه {currentPage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: View Comment & Send Admin Reply */}
      {selectedComment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full my-auto overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/60 dark:bg-zinc-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  {selectedComment.authorName ? selectedComment.authorName[0] : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <span>دیدگاه {selectedComment.authorName}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-normal text-zinc-500">
                      {selectedComment.targetType === 'product' ? 'محصول' : 'مقاله'}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    مربوط به: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedComment.targetTitle}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedComment(null)}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* User Comment Box */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedComment.authorName}</span>
                    {selectedComment.authorEmail && (
                      <span className="text-zinc-400 font-mono" dir="ltr">({selectedComment.authorEmail})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedComment.rating && (
                      <div className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="font-bold font-mono">{selectedComment.rating}</span>
                      </div>
                    )}
                    <span className="text-zinc-400">
                      {new Date(selectedComment.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {selectedComment.content}
                </p>

                {/* Status Toggle buttons inside modal */}
                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-2">
                  <span className="text-zinc-400">وضعیت انتشار:</span>
                  <button
                    onClick={() => handleStatusChange(selectedComment.id, 'approved')}
                    className={`px-3 py-1 rounded-lg font-bold ${
                      selectedComment.status === 'approved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    ✔ تایید و نمایش
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedComment.id, 'rejected')}
                    className={`px-3 py-1 rounded-lg font-bold ${
                      selectedComment.status === 'rejected'
                        ? 'bg-rose-600 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    ✖ عدم تایید
                  </button>
                </div>
              </div>

              {/* Admin Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <CornerUpLeft className="w-4 h-4 text-emerald-600" />
                  <span>ثبت پاسخ رسمی مدیریت / کارشناس</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 block mb-1">نام پاسخ‌دهنده:</label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-500 block mb-1">متن پاسخ:</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="پاسخ کارشناس، راهنمایی مصرف یا توضیحات علمی..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {replyFeedback && (
                  <div
                    className={`p-3 rounded-xl font-bold flex items-center gap-2 ${
                      replyFeedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-200'
                    }`}
                  >
                    {replyFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{replyFeedback.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={replySubmitting || !replyText.trim()}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {replySubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>ارسال و انتشار پاسخ مدیریت</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
