'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bot, Database, MessageSquare, ShieldAlert, RefreshCw, Eye, ExternalLink, Clock, CheckCircle } from 'lucide-react';

interface Conversation {
  id: string;
  user_id?: string;
  status: 'active' | 'handed_off' | 'closed';
  started_at: string;
}

interface Citation {
  title: string;
  url: string;
  source_type: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  safety_flagged: boolean;
  handoff_suggested: boolean;
  created_at: string;
}

interface ChatbotStats {
  indexed_docs_count: number;
  conversations_count: number;
  safety_flags_count: number;
}

const API_BASE = 'http://localhost:8080/api/v1';

export default function AdminChatbotPage() {
  const [stats, setStats] = useState<ChatbotStats>({ indexed_docs_count: 0, conversations_count: 0, safety_flags_count: 0 });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Transcript Modal
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [transcriptMessages, setTranscriptMessages] = useState<Message[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/chatbot/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Silently handle error
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/chatbot/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchConversations();
  }, [fetchStats, fetchConversations]);

  const handleSyncKnowledge = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/chatbot/sync`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert(`نمایه دانش چت‌بات با موفقیت همگام شد. تعداد ${data.indexed_docs} اسناد نمایه گردید.`);
        fetchStats();
      } else {
        const data = await res.json();
        alert(`خطا: ${data.detail}`);
      }
    } catch {
      alert('خطا در همگام‌سازی نمایه دانش.');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenTranscript = async (conv: Conversation) => {
    setSelectedConv(conv);
    setTranscriptLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/chatbot/conversations/${conv.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setTranscriptMessages(data.messages || []);
      }
    } catch {
      setTranscriptMessages([]);
    } finally {
      setTranscriptLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">چت‌بات هوشمند دانش‌محور (Grounded Bot)</h1>
          <p className="text-xs text-slate-500">پاسخگویی خودکار مستند به کاتالوگ محصولات، مقالات تاییدشده و کنترل ادعای پزشکی</p>
        </div>
        <button
          onClick={handleSyncKnowledge}
          disabled={syncing}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs self-start disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>همگام‌سازی نمایه دانش (Re-Sync)</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">اسناد نمایه دانش فعال</div>
            <div className="text-lg font-bold text-slate-900">{stats.indexed_docs_count.toLocaleString('fa-IR')} سند</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">کل گفتگوهای انجام‌شده</div>
            <div className="text-lg font-bold text-slate-900">{stats.conversations_count.toLocaleString('fa-IR')} گفتگو</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">هشدارهای پرچم‌گذاری پزشکی</div>
            <div className="text-lg font-bold text-amber-700">{stats.safety_flags_count.toLocaleString('fa-IR')} مورد</div>
          </div>
        </div>
      </div>

      {/* Conversations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
          سوابق گفتگوهای چت‌بات
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Clock className="w-6 h-6 mx-auto mb-2 animate-pulse" />
            در حال بارگذاری سوابق گفتگوها...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Bot className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            هیچ گفتگویی ثبت نشده است
          </div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">شناسه گفتگو (Conversation ID)</th>
                <th className="p-3.5">وضعیت</th>
                <th className="p-3.5">زمان شروع</th>
                <th className="p-3.5">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conversations.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono text-slate-900 dir-ltr text-right font-semibold">
                    {c.id}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : c.status === 'handed_off'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {c.status === 'active' ? 'فعال' : c.status === 'handed_off' ? 'ارجاع‌شده به پشتیبانی' : 'بسته شده'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500">
                    {new Date(c.started_at).toLocaleString('fa-IR')}
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => handleOpenTranscript(c)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      مشاهده ریز متن (Transcript)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Transcript Modal */}
      {selectedConv && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-xl w-full space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <span>متن گفتگوی چت‌بات</span>
              </h3>
              <span className="font-mono text-xs text-slate-400 dir-ltr">{selectedConv.id}</span>
            </div>

            {transcriptLoading ? (
              <p className="text-xs text-slate-400 text-center py-6">در حال بارگذاری پیام‌ها...</p>
            ) : (
              <div className="space-y-3 text-xs">
                {transcriptMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl space-y-1 ${
                      m.role === 'user'
                        ? 'bg-purple-50/70 border border-purple-100 mr-8 text-purple-950'
                        : 'bg-slate-50 border border-slate-200 ml-8 text-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                      <span>{m.role === 'user' ? '👤 کاربر' : '🤖 دستیار هوشمند سبزینه'}</span>
                      <span>{new Date(m.created_at).toLocaleTimeString('fa-IR')}</span>
                    </div>

                    <p className="leading-relaxed">{m.content}</p>

                    {m.safety_flagged && (
                      <div className="bg-amber-100 text-amber-900 p-2 rounded-lg text-[10px] font-bold flex items-center gap-1 mt-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        پرچم ایمنی: سوال غیرمجاز درمانی یا ادعای پزشکی
                      </div>
                    )}

                    {m.citations && m.citations.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-slate-200/60 space-y-1">
                        <div className="text-[10px] font-bold text-slate-500">منابع استنادی (Citations):</div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.citations.map((cite, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-medium text-slate-700">
                              🔗 {cite.title} ({cite.source_type})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedConv(null)}
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
