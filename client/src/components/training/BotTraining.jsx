import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function BotTraining() {
  const [config, setConfig] = useState({ name: '', greeting: '', systemPrompt: '', tone: 'professional', language: 'en' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/owner/bot-config').then((res) => {
      if (res.data.botConfig) setConfig(res.data.botConfig);
    });
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      await api.put('/owner/bot-config', config);
      toast.success('Bot config saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
    setLoading(false);
  };

  const update = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-100">Bot Configuration</h2>
        <p className="text-sm text-slate-500">Configure your AI assistant's personality and behavior</p>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-5 max-w-2xl">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Bot Name</label>
          <input value={config.name} onChange={(e) => update('name', e.target.value)} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Greeting Message</label>
          <input value={config.greeting} onChange={(e) => update('greeting', e.target.value)} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">System Prompt</label>
          <textarea value={config.systemPrompt} onChange={(e) => update('systemPrompt', e.target.value)} rows={6} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm resize-y" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Tone</label>
            <select value={config.tone} onChange={(e) => update('tone', e.target.value)} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm">
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Language</label>
            <input value={config.language} onChange={(e) => update('language', e.target.value)} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
          </div>
        </div>

        <button onClick={save} disabled={loading} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors">
          {loading ? 'Saving...' : 'Save Config'}
        </button>
      </div>
    </div>
  );
}
