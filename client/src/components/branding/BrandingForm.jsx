import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

export default function BrandingForm() {
  const [config, setConfig] = useState({ name: '', accent: '#818cf8', logo: '' });
  const [loading, setLoading] = useState(false);
  const tenant = useAuthStore((s) => s.tenant);

  useEffect(() => {
    api.get('/owner/branding').then((res) => {
      if (res.data.brandConfig) setConfig(res.data.brandConfig);
    });
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      await api.put('/owner/branding', config);
      toast.success('Branding saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-100">Branding</h2>
        <p className="text-sm text-slate-500">Customize your widget's look and feel</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Brand Name</label>
            <input value={config.name} onChange={(e) => setConfig({ ...config, name: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Accent Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={config.accent} onChange={(e) => setConfig({ ...config, accent: e.target.value })} className="w-12 h-10 bg-transparent border border-[#334155] rounded-lg cursor-pointer" />
              <input value={config.accent} onChange={(e) => setConfig({ ...config, accent: e.target.value })} className="flex-1 px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm font-mono" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">API Key</label>
            <div className="px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-400 text-sm font-mono select-all">
              {tenant?.apiKey || '-'}
            </div>
          </div>

          <button onClick={save} disabled={loading} className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm">
            {loading ? 'Saving...' : 'Save Branding'}
          </button>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Preview</h3>
          <div className="rounded-xl overflow-hidden border border-[#334155]" style={{ background: '#0f172a' }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: config.accent }}>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                {(config.name || 'S')[0].toUpperCase()}
              </div>
              <span className="text-white font-semibold text-sm">{config.name || 'Support'}</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-[#1e293b] rounded-lg rounded-bl-none px-3 py-2 text-sm text-slate-300 max-w-[80%]">
                Hello! How can I help you?
              </div>
              <div className="rounded-lg rounded-br-none px-3 py-2 text-sm text-white max-w-[80%] ml-auto" style={{ background: config.accent }}>
                I have a question
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
