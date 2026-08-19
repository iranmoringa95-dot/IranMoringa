'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Check, X, CornerUpLeft, Clock, ShieldCheck, ThumbsUp, AlertCircle, RefreshCw } from 'lucide-react';

interface OfficialReply {
  id: string;
  actor_name: string;
  reply_body: string;
  created_at: string;
}

interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_buyer: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  helpful_count: number;
  unhelpful_count: number;
  official_reply?: OfficialReply;
  created_at: string;
}

interface QuestionAnswer {
  id: string;
  actor_name: string;
  answer_body: string;
  is_official: boolean;
  status: string;
  created_at: string;
}

interface Question {
  id: string;
  product_id: string;
  customer_name: string;
  question_body: string;
  status: 'pending' | 'approved' | 'rejected';
  answers: QuestionAnswer[];
  created_at: string;
}

const API_BASE = 'http://localhost:8080/api/v1';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'questions'>('reviews');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  // Modals
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [modalType, setModalType] = useState<'reject_review' | 'reply_review' | 'answer_question' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch {
      // Silently handle error
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchQuestions();
  }, [fetchReviews, fetchQuestions]);

  const handleReviewStatus = async (reviewId: string, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/reviews/${reviewId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });

      if (res.ok) {
        setModalType(null);
        setSelectedReview(null);
        setRejectionReason('');
        fetchReviews();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در به‌روزرسانی وضعیت دیدگاه.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOfficialReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !replyText.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/reviews/${selectedReview.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_body: replyText }),
      });

      if (res.ok) {
        alert('پاسخ رسمی پشتیبانی با موفقیت ثبت شد.');
        setModalType(null);
        setSelectedReview(null);
        setReplyText('');
        fetchReviews();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در ثبت پاسخ رسمی.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuestionStatus = async (questionId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/questions/${questionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        fetchQuestions();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در به‌روزرسانی پرسش.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnswerQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !replyText.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/questions/${selectedQuestion.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_body: replyText }),
      });

      if (res.ok) {
        alert('پاسخ رسمی به پرسش ثبت شد.');
        setModalType(null);
        setSelectedQuestion(null);
        setReplyText('');
        fetchQuestions();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در ثبت پاسخ.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReviews = reviews.filter((r) => statusFilter === '' || r.status === statusFilter);
  const pendingReviewsCount = reviews.filter((r) => r.status === 'pending').length;
  const pendingQuestionsCount = questions.filter((q) => q.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">مدیریت دیدگاه‌ها، امتیازات و پرسش‌ها</h1>
          <p className="text-xs text-slate-500">صف تایید دیدگاه‌های مشتریان، ثبت پاسخ رسمی پشتیبانی و پاسخ به سوالات</p>
        </div>
        <button
          onClick={() => { fetchReviews(); fetchQuestions(); }}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>به‌روزرسانی صف</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>دیدگاه‌ها</span>
          {pendingReviewsCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingReviewsCount.toLocaleString('fa-IR')}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>پرسش و پاسخ (Q&A)</span>
          {pendingQuestionsCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingQuestionsCount.toLocaleString('fa-IR')}
            </span>
          )}
        </button>
      </div>

      {/* ── Reviews Tab ── */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              { value: 'pending', label: 'در انتظار تایید' },
              { value: 'approved', label: 'تایید شده' },
              { value: 'rejected', label: 'رد شده' },
              { value: '', label: 'همه' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  statusFilter === f.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white p-12 rounded-2xl text-center text-slate-400 text-sm">
                <Clock className="w-6 h-6 mx-auto mb-2 animate-pulse" />
                در حال بارگذاری دیدگاه‌ها...
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl text-center text-slate-400 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                هیچ دیدگاهی در این بخش وجود ندارد
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div key={rev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{rev.customer_name}</span>
                      {rev.is_verified_buyer && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          خریدار واقعی
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        rev.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : rev.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {rev.status === 'approved' ? 'تایید شده' : rev.status === 'rejected' ? 'رد شده' : 'در انتظار تایید'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  </div>

                  <div>
                    {rev.title && <h4 className="font-bold text-slate-900 text-xs mb-1">{rev.title}</h4>}
                    <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                  </div>

                  {rev.rejection_reason && (
                    <div className="bg-red-50 text-red-800 text-xs p-2.5 rounded-xl border border-red-100">
                      علت رد: {rev.rejection_reason}
                    </div>
                  )}

                  {/* Official Reply Box */}
                  {rev.official_reply && (
                    <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs space-y-1">
                      <div className="font-bold text-emerald-800 flex items-center gap-1">
                        <CornerUpLeft className="w-3.5 h-3.5" />
                        <span>پاسخ رسمی {rev.official_reply.actor_name}</span>
                      </div>
                      <p className="text-slate-700">{rev.official_reply.reply_body}</p>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-2 flex flex-wrap gap-2 justify-end">
                    {rev.status !== 'approved' && (
                      <button
                        onClick={() => handleReviewStatus(rev.id, 'approve')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        تایید دیدگاه
                      </button>
                    )}

                    {rev.status !== 'rejected' && (
                      <button
                        onClick={() => { setSelectedReview(rev); setModalType('reject_review'); }}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        رد دیدگاه
                      </button>
                    )}

                    <button
                      onClick={() => { setSelectedReview(rev); setModalType('reply_review'); setReplyText(rev.official_reply?.reply_body || ''); }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      پاسخ رسمی پشتیبانی
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Questions Tab ── */}
      {activeTab === 'questions' && (
        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center text-slate-400 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2" />
              هیچ پرسشی ثبت نشده است
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-900 text-xs">{q.customer_name} پرسیده:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    q.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {q.status === 'approved' ? 'تایید شده' : 'در انتظار تایید'}
                  </span>
                </div>

                <p className="text-xs text-slate-800 font-medium">{q.question_body}</p>

                {/* Answers */}
                {q.answers?.map((ans) => (
                  <div key={ans.id} className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 border border-slate-100">
                    <div className="font-bold text-slate-700 flex items-center gap-1">
                      {ans.is_official && <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.2 rounded">رسمی</span>}
                      <span>{ans.actor_name}:</span>
                    </div>
                    <p className="text-slate-600">{ans.answer_body}</p>
                  </div>
                ))}

                <div className="pt-2 flex gap-2 justify-end">
                  {q.status !== 'approved' && (
                    <button
                      onClick={() => handleQuestionStatus(q.id, 'approve')}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      تایید پرسش
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedQuestion(q); setModalType('answer_question'); setReplyText(''); }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    ارسال پاسخ رسمی
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reject Modal */}
      {selectedReview && modalType === 'reject_review' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">رد دیدگاه مشتری</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">علت رد دیدگاه</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="توضیح علت عدم انتشار..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs rounded-xl font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={() => handleReviewStatus(selectedReview.id, 'reject', rejectionReason)}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700"
              >
                تایید و رد دیدگاه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Reply Modal */}
      {selectedReview && modalType === 'reply_review' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">ثبت پاسخ رسمی پشتیبانی</h3>
            <form onSubmit={handleOfficialReply} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">متن پاسخ رسمی</label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ رسمی پشتیبانی سبزینه..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs rounded-xl font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700"
                >
                  ثبت پاسخ رسمی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Answer Question Modal */}
      {selectedQuestion && modalType === 'answer_question' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">ارسال پاسخ رسمی به پرسش</h3>
            <form onSubmit={handleAnswerQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">متن پاسخ</label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ رسمی به پرسش مشتری..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs rounded-xl font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700"
                >
                  ارسال پاسخ رسمی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
