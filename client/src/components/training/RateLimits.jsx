import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function RateLimits() {
  const [config, setConfig] = useState({ messagesPerMin: 10, messagesPerDay: 100, tokensPerMsg: 2000 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/owner/rate-limits').then((res) => {
      if (res.data.rateLimitConfig) setConfig(res.data.rateLimitConfig);
    });
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      await api.put('/owner/rate-limits', config);
      toast.success('Rate limits saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
    setLoading(false);
  };

  const update = (key, value) => setConfig((prev) => ({ ...prev, [key]: parseInt(value) || 0 }));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-100">Rate Limits</h2>
        <p className="text-sm text-slate-500">Configure rate limiting for your chat widget</p>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-5 max-w-md">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Messages per Minute</label>
          <input type="number" min={1} max={120} value={config.messagesPerMin} onChange={(e) => update('messagesPerMin', e.target.value)} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Messages per Day</label>
          <input type="number" min={1} max={10000} value={config.messagesPerDay} onChange={(e) => update('messagesPerDay', e.target.value)} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Max Tokens per Message</label>
          <input type="number" min={100} max={8000} value={config.tokensPerMsg} onChange={(e) => update('tokensPerMsg', e.target.value)} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
        </div>

        <button onClick={save} disabled={loading} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors">
          {loading ? 'Saving...' : 'Save Limits'}
        </button>
      </div>
    </div>
  );
}
