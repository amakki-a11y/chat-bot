import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../api/client';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';

export default function FAQList() {
  const [faqs, setFaqs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ question: '', answer: '', category: 'general' });
  const [editId, setEditId] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/faq');
      setFaqs(res.data.faqs || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editId) {
        await api.put(`/faq/${editId}`, form);
        toast.success('FAQ updated');
      } else {
        await api.post('/faq', form);
        toast.success('FAQ created');
      }
      setShowForm(false);
      setEditId(null);
      setForm({ question: '', answer: '', category: 'general' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const handleEdit = (f) => {
    setForm({ question: f.question, answer: f.answer, category: f.category });
    setEditId(f.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this FAQ?')) return;
    await api.delete(`/faq/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">FAQ Manager</h2>
          <p className="text-sm text-slate-500">{faqs.length} questions</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ question: '', answer: '', category: 'general' }); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg">
          <Plus size={16} /> New FAQ
        </button>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase w-8">#</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Question</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Category</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Active</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faqs.map((f, i) => (
              <tr key={f.id} className="border-b border-[#0f172a] hover:bg-[#334155]/30">
                <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                <td className="px-4 py-3 text-slate-200">{f.question}</td>
                <td className="px-4 py-3"><Badge className="bg-blue-500/20 text-blue-400">{f.category}</Badge></td>
                <td className="px-4 py-3"><Badge className={f.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}>{f.isActive ? 'Yes' : 'No'}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(f)} className="text-indigo-400 hover:text-indigo-300 text-xs mr-3">Edit</button>
                  <button onClick={() => handleDelete(f.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {faqs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No FAQs found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit FAQ' : 'New FAQ'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Question</label>
            <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Answer</label>
            <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm resize-y" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Category</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
          </div>
          <button onClick={handleSave} className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-sm">
            {editId ? 'Update FAQ' : 'Create FAQ'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
