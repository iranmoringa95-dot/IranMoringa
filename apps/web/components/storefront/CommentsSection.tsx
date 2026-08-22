'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Star,
  Send,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CornerDownLeft,
  X,
  RefreshCw,
  ThumbsUp,
  Sparkles,
} from 'lucide-react';

interface CommentItem {
  id: string;
  target_type: string;
  target_id?: string;
  target_title: string;
  parent_id?: string;
  author_name: string;
  rating?: number | null;
  content: string;
  status: string;
  is_buyer_verified: boolean;
  is_admin_reply: boolean;
  like_count: number;
  created_at: string;
  replies?: CommentItem[];
}

interface Props {
  targetType: 'article' | 'product' | 'page';
  targetId?: string;
  targetSlug: string;
  targetTitle: string;
  showRating?: boolean;
}

export function CommentsSection({ targetType, targetId, targetSlug, targetTitle, showRating = false }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratedCount, setRatedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form State
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);

  // Submission Status
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: targetType,
        slug: targetSlug,
        title: targetTitle,
      });
      if (targetId) params.append('target_id', targetId);

      const res = await fetch(`/api/v1/comments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setTotalCount(data.totalCount || 0);
        setAverageRating(data.averageRating || 0);
        setRatedCount(data.ratedCount || 0);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, targetSlug, targetTitle]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        target_type: targetType,
        target_id: targetId || null,
        target_title: targetTitle,
        parent_id: replyingTo ? replyingTo.id : null,
        author_name: authorName.trim(),
        author_email: authorEmail.trim() || null,
        rating: showRating ? rating : null,
        content: content.trim(),
      };

      const res = await fetch('/api/v1/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: 'دیدگاه ارزشمند شما با موفقیت ثبت و منتشر گردید.',
        });
        setContent('');
        setReplyingTo(null);
        fetchComments();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'خطا در ثبت نظر. لطفاً دوباره تلاش کنید.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'خطا در برقراری ارتباط با سرور.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white dark:bg-[#091e18] rounded-3xl border border-stone-200 dark:border-emerald-900/60 p-6 sm:p-10 shadow-xs space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-emerald-950/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-[#d0de41] flex items-center justify-center shadow-inner">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>دیدگاه‌ها و پرسش‌های کاربران</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-[#d0de41] border border-emerald-200 dark:border-emerald-800 font-bold font-mono">
                {totalCount.toLocaleString('fa-IR')}
              </span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              نظرات، تجربیات مصرف و پرسش‌های خود را با کارشناسان و سایر کاربران در میان بگذارید.
            </p>
          </div>
        </div>

        {/* Rating summary for products */}
        {showRating && averageRating > 0 && (
          <div className="flex items-center gap-2.5 bg-[#faf8f5] dark:bg-[#051410] px-4 py-2 rounded-2xl border border-stone-200/80 dark:border-emerald-900/60">
            <div className="flex items-center text-amber-500 gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-700'}`}
                />
              ))}
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
              <span>{averageRating.toLocaleString('fa-IR')}</span> از ۵
              <span className="text-[10px] text-stone-400 font-normal mr-1">({ratedCount} نظر)</span>
            </div>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-stone-400">در حال بارگذاری نظرات کاربران...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center space-y-2 bg-[#faf8f5] dark:bg-[#051410] rounded-2xl border border-dashed border-stone-200 dark:border-emerald-900/40 p-6">
            <Sparkles className="w-8 h-8 text-stone-400 mx-auto opacity-50" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">هنوز دیدگاهی برای این مطلب ثبت نشده است.</p>
            <p className="text-xs text-stone-400">اولین نفری باشید که نظر یا پرسش خود را ثبت می‌کنید!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-5 bg-[#faf8f5] dark:bg-[#051410] rounded-2xl border border-stone-200/80 dark:border-emerald-900/50 space-y-3"
              >
                {/* Comment Author Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white font-black flex items-center justify-center text-sm shadow-sm">
                      {comment.author_name ? comment.author_name[0] : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {comment.author_name}
                        </span>
                        {comment.is_admin_reply && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-[#d0de41] border border-emerald-300 dark:border-emerald-800">
                            پاسخ مدیر / کارشناس
                          </span>
                        )}
                        {comment.is_buyer_verified && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            خریدار
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {new Date(comment.created_at).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  {comment.rating && comment.rating > 0 && (
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= comment.rating! ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-700'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>

                {/* Reply action */}
                <div className="pt-2 flex items-center justify-between border-t border-stone-200/50 dark:border-emerald-950/60 text-xs">
                  <button
                    onClick={() => {
                      setReplyingTo(comment);
                      const el = document.getElementById('comment-form');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-emerald-700 dark:text-[#d0de41] font-bold hover:underline flex items-center gap-1"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    <span>پاسخ به این دیدگاه</span>
                  </button>
                </div>

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 mr-4 sm:mr-8 space-y-2.5 border-r-2 border-emerald-500/40 pr-3 sm:pr-4">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                          reply.is_admin_reply
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-white dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {reply.author_name}
                            {reply.is_admin_reply && (
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-full font-bold">
                                پاسخ کارشناس مورینگا
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(reply.created_at).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Comment Submission Form */}
      <div id="comment-form" className="pt-4 border-t border-stone-100 dark:border-emerald-950 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span>ثبت دیدگاه یا پرسش جدید</span>
          </h4>
          {replyingTo && (
            <button
              onClick={() => setReplyingTo(null)}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-bold"
            >
              <X className="w-3.5 h-3.5" />
              <span>لغو پاسخ به {replyingTo.author_name}</span>
            </button>
          )}
        </div>

        {replyingTo && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
            در حال پاسخ به: <span className="font-bold">{replyingTo.author_name}</span> — «{replyingTo.content.slice(0, 60)}...»
          </div>
        )}

        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/80 border border-rose-300 text-rose-800 dark:text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Star rating selector if applicable */}
          {showRating && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">امتیاز شما به این محصول:</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setRating(s)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-6 h-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-700'}`} />
                  </button>
                ))}
                <span className="font-bold text-slate-700 dark:text-slate-300 mr-2">({rating} از ۵ ستاره)</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                نام و نام خانوادگی <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: سارا محمدی"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full p-3 bg-[#faf8f5] dark:bg-[#051410] border border-stone-200 dark:border-emerald-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026251] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                آدرس ایمیل (اختیاری)
              </label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                className="w-full p-3 bg-[#faf8f5] dark:bg-[#051410] border border-stone-200 dark:border-emerald-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026251] text-slate-900 dark:text-white font-mono"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              متن دیدگاه یا پرسش شما <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="دیدگاه، تجربه مصرف، سوالات علمی یا نظرات ارزشمند خود را بنویسید..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3.5 bg-[#faf8f5] dark:bg-[#051410] border border-stone-200 dark:border-emerald-900/60 rounded-xl leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#026251] text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="py-3 px-6 bg-[#026251] hover:bg-[#024a3d] text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>ارسال و ثبت دیدگاه</span>
          </button>
        </form>
      </div>
    </section>
  );
}
