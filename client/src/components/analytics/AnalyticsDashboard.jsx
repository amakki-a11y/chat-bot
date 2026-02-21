import { useState, useEffect } from 'react';
import api from '../../api/client';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = async (d) => {
    setLoading(true);
    try {
      const res = await api.get(`/owner/analytics?days=${d}`);
      setData(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(days); }, [days]);

  const o = data?.overview || {};
  const stats = [
    { label: 'Total Tickets', value: o.totalTickets, color: 'text-slate-100' },
    { label: 'Open Tickets', value: o.openTickets, color: 'text-amber-400' },
    { label: 'Resolved', value: o.resolvedTickets, color: 'text-green-400' },
    { label: 'Chat Sessions', value: o.totalSessions, color: 'text-slate-100' },
    { label: 'Active Chats', value: o.activeSessions, color: 'text-green-400' },
    { label: 'Messages', value: o.totalMessages, color: 'text-slate-100' },
    { label: 'KB Articles', value: o.kbArticleCount, color: 'text-slate-100' },
    { label: 'FAQs', value: o.faqCount, color: 'text-slate-100' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-100">Analytics Dashboard</h2>
        <p className="text-sm text-slate-500">Overview of your support system</p>
      </div>

      <div className="flex gap-2 mb-6">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              days === d ? 'bg-indigo-500 text-white' : 'bg-[#334155] text-slate-300 hover:bg-[#475569]'
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-[#334155] rounded w-20 mb-3" />
              <div className="h-8 bg-[#334155] rounded w-14" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{s.label}</div>
              <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value ?? 0}</div>
            </div>
          ))}
        </div>
      )}

      {data?.ticketsByPriority?.length > 0 && (
        <div className="mt-6 bg-[#1e293b] border border-[#334155] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Tickets by Priority</h3>
          <div className="flex gap-4">
            {data.ticketsByPriority.map((item) => (
              <div key={item.priority} className="text-center">
                <div className="text-lg font-bold text-slate-100">{item.count}</div>
                <div className="text-[11px] text-slate-500 capitalize">{item.priority}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
