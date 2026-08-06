'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, History, Search } from 'lucide-react';
import { toJalaliDate } from '@/lib/localization/jalali';

interface AuditLogItem {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('http://localhost:8080/api/v1/admin/audit-logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data || []);
        }
      } catch (err) {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchFilter.toLowerCase()) ||
      l.actor_id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      l.details.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">لاگ‌های امنیتی و نظارتی (Audit Logs)</h1>
          <p className="text-xs text-slate-500">ثبت شفاف و غیرقابل تغییر تمامی تغییرات مدیریتی سیستم</p>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="جست‌وجو در لاگ‌ها..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 animate-pulse text-slate-400">
          در حال دریافت لاگ‌های امنیتی...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-2">
          <History className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-medium text-slate-700">هیچ لاگ مدیریتی مطابق با جست‌وجو یافت نشد.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">کاربر / نقش</th>
                <th className="p-4">عملیات</th>
                <th className="p-4">موجودیت</th>
                <th className="p-4">جزئیات</th>
                <th className="p-4">زمان ثبت</th>
                <th className="p-4">آدرس IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 text-slate-900 font-bold">{log.actor_id} ({log.actor_role})</td>
                  <td className="p-4 text-emerald-700 font-bold">{log.action}</td>
                  <td className="p-4 text-slate-600">{log.entity_type} #{log.entity_id}</td>
                  <td className="p-4 text-slate-800 font-sans">{log.details}</td>
                  <td className="p-4 text-slate-500 font-sans">{toJalaliDate(log.created_at || new Date().toISOString())}</td>
                  <td className="p-4 text-slate-500">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
