import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

export default function WidgetPreview() {
  const [config, setConfig] = useState(null);
  const [copied, setCopied] = useState(false);
  const tenant = useAuthStore((s) => s.tenant);

  useEffect(() => {
    Promise.all([
      api.get('/owner/bot-config'),
      api.get('/owner/branding'),
      api.get('/owner/channels'),
    ]).then(([bot, brand, ch]) => {
      setConfig({
        bot: bot.data.botConfig || {},
        brand: brand.data.brandConfig || {},
        channels: ch.data.channelConfig || {},
      });
    }).catch(() => {
      // Fallback to tenant data from auth store
      setConfig({
        bot: tenant?.botConfig || {},
        brand: tenant?.brandConfig || {},
        channels: tenant?.channelConfig || {},
      });
    });
  }, []);

  const embedCode = `<script src="${window.location.origin}/widget.js" data-tenant-key="${tenant?.apiKey || 'tk_xxxxx'}"></script>`;

  const copyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!config) return <div className="text-slate-500">Loading preview...</div>;

  const accent = config.brand.accent || '#818cf8';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-100">Widget Preview</h2>
        <p className="text-sm text-slate-500">Preview how your chat widget will appear to customers</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Live Preview</h3>
          <div className="w-80 rounded-2xl overflow-hidden border border-[#334155] shadow-2xl">
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: accent }}>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                {(config.bot.name || 'S')[0].toUpperCase()}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{config.bot.name || 'Support Bot'}</div>
                <div className="text-white/70 text-xs">Online</div>
              </div>
            </div>

            <div className="bg-[#0f172a] p-4 h-72 flex flex-col justify-end gap-3">
              <div className="bg-[#1e293b] rounded-xl rounded-bl-none px-4 py-3 text-sm text-slate-300 max-w-[85%]">
                {config.bot.greeting || 'Hello! How can I help you?'}
              </div>
              <div className="rounded-xl rounded-br-none px-4 py-3 text-sm text-white max-w-[85%] ml-auto" style={{ background: accent }}>
                I need help with my order
              </div>
              <div className="bg-[#1e293b] rounded-xl rounded-bl-none px-4 py-3 text-sm text-slate-300 max-w-[85%]">
                I'd be happy to help! Could you provide your order number?
              </div>
            </div>

            <div className="bg-[#1e293b] border-t border-[#334155] p-3 flex gap-2">
              <div className="flex-1 px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-sm text-slate-500">
                Type a message...
              </div>
              <button className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: accent }}>
                Send
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(config.channels).filter(([, v]) => v).map(([k]) => (
              <span key={k} className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">
                {k}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Embed Code</h3>
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-3">
              Add this script to your website to embed the chat widget:
            </p>
            <div className="relative">
              <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 text-xs text-green-400 font-mono overflow-x-auto">
                {embedCode}
              </pre>
              <button
                onClick={copyCode}
                className="absolute top-2 right-2 p-1.5 bg-[#334155] hover:bg-[#475569] rounded text-slate-300"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="mt-4 bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Widget Configuration</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Bot Name</span><span className="text-slate-200">{config.bot.name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tone</span><span className="text-slate-200 capitalize">{config.bot.tone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Language</span><span className="text-slate-200">{config.bot.language || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Brand</span><span className="text-slate-200">{config.brand.name || '-'}</span></div>
              <div className="flex justify-between">
                <span className="text-slate-500">Accent</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: accent }} />
                  <span className="text-slate-200 font-mono text-xs">{accent}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
