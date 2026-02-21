import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../api/client';
import Badge from '../ui/Badge';
import Pagination from '../ui/Pagination';
import Modal from '../ui/Modal';
import { priorityColors, statusColors, formatDate } from '../../lib/utils';

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: 'customer@example.com', subject: '', description: '', priority: 'medium', category: 'general' });
  const navigate = useNavigate();

  const load = async (p = page) => {
    try {
      const res = await api.get(`/tickets?page=${p}&limit=20`);
      setTickets(res.data.tickets || []);
      setTotal(res.data.total || 0);
    } catch {}
  };

  useEffect(() => { load(page); }, [page]);

  const handleCreate = async () => {
    try {
      await api.post('/tickets', form);
      toast.success('Ticket created');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this ticket?')) return;
    await api.delete(`/tickets/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Support Tickets</h2>
          <p className="text-sm text-slate-500">{total} tickets</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Ticket #</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Subject</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Priority</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Created</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-b border-[#0f172a] hover:bg-[#334155]/30 cursor-pointer" onClick={() => navigate(`/dashboard/tickets/${t.id}`)}>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{t.ticketNo}</td>
                <td className="px-4 py-3 text-slate-200">{t.subject}</td>
                <td className="px-4 py-3"><Badge className={statusColors[t.status]}>{t.status}</Badge></td>
                <td className="px-4 py-3"><Badge className={priorityColors[t.priority]}>{t.priority}</Badge></td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(t.createdAt)}</td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No tickets found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Ticket">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Subject</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm resize-y" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
            </div>
          </div>
          <button onClick={handleCreate} className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-sm">Create Ticket</button>
        </div>
      </Modal>
    </div>
  );
}
