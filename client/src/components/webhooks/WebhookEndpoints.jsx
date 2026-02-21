import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, FileText } from 'lucide-react';
import api from '../../api/client';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Pagination from '../ui/Pagination';

const EVENTS = [
  'chat_message', 'chat_session_started', 'chat_session_closed',
  'ticket_created', 'ticket_updated', 'ticket_replied', 'ticket_closed',
];

export default function WebhookEndpoints() {
  const [endpoints, setEndpoints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showLogs, setShowLogs] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [form, setForm] = useState({ name: '', url: '', secret: '', events: [], isActive: true });
  const [editId, setEditId] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/webhooks');
      setEndpoints(res.data.endpoints || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editId) {
        await api.put(`/webhooks/${editId}`, form);
        toast.success('Endpoint updated');
      } else {
        await api.post('/webhooks', form);
        toast.success('Endpoint created');
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: '', url: '', secret: '', events: [], isActive: true });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const handleEdit = (ep) => {
    setForm({ name: ep.name, url: ep.url, secret: ep.secret, events: ep.events, isActive: ep.isActive });
    setEditId(ep.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this endpoint?')) return;
    await api.delete(`/webhooks/${id}`);
    toast.success('Deleted');
    load();
  };

  const viewLogs = async (ep, p = 1) => {
    setShowLogs(ep);
    setLogPage(p);
    try {
      const res = await api.get(`/webhooks/${ep.id}/logs?page=${p}&limit=10`);
      setLogs(res.data.logs || []);
      setLogTotal(res.data.totalPages || 1);
    } catch {}
  };

  const toggleEvent = (evt) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(evt) ? prev.events.filter((e) => e !== evt) : [...prev.events, evt],
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Webhooks</h2>
          <p className="text-sm text-slate-500">{endpoints.length} endpoints</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ name: '', url: '', secret: '', events: [], isActive: true }); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg">
          <Plus size={16} /> New Endpoint
        </button>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">URL</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Events</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Active</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep) => (
              <tr key={ep.id} className="border-b border-[#0f172a] hover:bg-[#334155]/30">
                <td className="px-4 py-3 text-slate-200 font-medium">{ep.name}</td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono truncate max-w-[200px]">{ep.url}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {ep.events.map((e) => (
                      <Badge key={e} className="bg-indigo-500/20 text-indigo-400">{e}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3"><Badge className={ep.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}>{ep.isActive ? 'Yes' : 'No'}</Badge></td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => viewLogs(ep)} className="text-slate-400 hover:text-slate-200 mr-2"><FileText size={14} /></button>
                  <button onClick={() => handleEdit(ep)} className="text-indigo-400 hover:text-indigo-300 text-xs mr-2">Edit</button>
                  <button onClick={() => handleDelete(ep.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {endpoints.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No webhook endpoints</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Endpoint' : 'New Endpoint'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">URL</label>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Secret (for HMAC signing)</label>
            <input value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Events</label>
            <div className="grid grid-cols-2 gap-2">
              {EVENTS.map((evt) => (
                <label key={evt} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.events.includes(evt)} onChange={() => toggleEvent(evt)} className="rounded" />
                  {evt}
                </label>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-sm">
            {editId ? 'Update Endpoint' : 'Create Endpoint'}
          </button>
        </div>
      </Modal>

      {/* Logs Modal */}
      <Modal open={!!showLogs} onClose={() => setShowLogs(null)} title={`Logs: ${showLogs?.name || ''}`}>
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className={`p-3 rounded-lg border ${log.success ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
              <div className="flex items-center justify-between mb-1">
                <Badge className={log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>{log.statusCode || 'ERR'}</Badge>
                <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <div className="text-xs text-slate-400">Event: {log.event} | Retries: {log.retries}</div>
              {log.error && <div className="text-xs text-red-400 mt-1">{log.error}</div>}
            </div>
          ))}
          {logs.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No logs yet</p>}
          <Pagination page={logPage} totalPages={logTotal} onChange={(p) => viewLogs(showLogs, p)} />
        </div>
      </Modal>
    </div>
  );
}
