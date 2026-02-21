import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function ChannelSettings() {
  const [channels, setChannels] = useState({});
  const [fileConfig, setFileConfig] = useState({ maxSizeMb: 10, allowedTypes: [], maxFiles: 5 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/owner/channels').then((res) => {
      if (res.data.channelConfig) setChannels(res.data.channelConfig);
    });
    api.get('/owner/file-settings').then((res) => {
      if (res.data.fileConfig) setFileConfig(res.data.fileConfig);
    });
  }, []);

  const saveChannels = async () => {
    setLoading(true);
    try {
      await api.put('/owner/channels', channels);
      toast.success('Channels saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const saveFileConfig = async () => {
    setLoading(true);
    try {
      await api.put('/owner/file-settings', fileConfig);
      toast.success('File settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const toggleChannel = (key) => setChannels((prev) => ({ ...prev, [key]: !prev[key] }));

  const channelLabels = {
    chat: 'Chat', voice: 'Voice', voiceNote: 'Voice Note',
    call: 'Call', faq: 'FAQ', tickets: 'Tickets', fileAttach: 'File Attachments',
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-100">Channels & File Settings</h2>
        <p className="text-sm text-slate-500">Configure support channels and file upload rules</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Channel Toggles</h3>
          <div className="space-y-3">
            {Object.entries(channelLabels).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-200">{label}</span>
                <button
                  type="button"
                  onClick={() => toggleChannel(key)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${channels[key] ? 'bg-green-500' : 'bg-[#334155]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${channels[key] ? 'translate-x-5' : ''}`} />
                </button>
              </label>
            ))}
          </div>
          <button onClick={saveChannels} disabled={loading} className="mt-5 w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm">
            Save Channels
          </button>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">File Upload Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Max File Size (MB)</label>
              <input type="number" min={1} max={100} value={fileConfig.maxSizeMb} onChange={(e) => setFileConfig({ ...fileConfig, maxSizeMb: parseInt(e.target.value) || 10 })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Max Files per Upload</label>
              <input type="number" min={1} max={20} value={fileConfig.maxFiles} onChange={(e) => setFileConfig({ ...fileConfig, maxFiles: parseInt(e.target.value) || 5 })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Allowed Types (comma-separated)</label>
              <input value={(fileConfig.allowedTypes || []).join(', ')} onChange={(e) => setFileConfig({ ...fileConfig, allowedTypes: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" placeholder="image/png, image/jpeg, application/pdf" />
            </div>
          </div>
          <button onClick={saveFileConfig} disabled={loading} className="mt-5 w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm">
            Save File Settings
          </button>
        </div>
      </div>
    </div>
  );
}
