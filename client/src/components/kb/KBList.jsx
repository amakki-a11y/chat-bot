import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2 } from 'lucide-react';
import api from '../../api/client';
import Badge from '../ui/Badge';
import Pagination from '../ui/Pagination';
import Modal from '../ui/Modal';

export default function KBList() {
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', tags: '', sourceType: 'text' });
  const [editId, setEditId] = useState(null);

  const load = async (p = page) => {
    try {
      const res = search
        ? await api.get(`/kb/search?q=${encodeURIComponent(search)}`)
        : await api.get(`/kb?page=${p}&limit=20`);
      setArticles(res.data.articles || []);
      setTotal(res.data.total || 0);
    } catch {}
  };

  useEffect(() => { load(page); }, [page]);

  const handleSearch = () => { setPage(1); load(1); };

  const handleSave = async () => {
    try {
      const data = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      if (editId) {
        await api.put(`/kb/${editId}`, data);
        toast.success('Article updated');
      } else {
        await api.post('/kb', data);
        toast.success('Article created');
      }
      setShowForm(false);
      setEditId(null);
      setForm({ title: '', content: '', category: 'general', tags: '', sourceType: 'text' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const handleEdit = (a) => {
    setForm({ title: a.title, content: a.content, category: a.category, tags: (a.tags || []).join(', '), sourceType: a.sourceType });
    setEditId(a.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this article?')) return;
    await api.delete(`/kb/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Knowledge Base</h2>
          <p className="text-sm text-slate-500">{total} articles</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ title: '', content: '', category: 'general', tags: '', sourceType: 'text' }); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg">
          <Plus size={16} /> New Article
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Search articles..." className="w-full pl-9 pr-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-slate-100 text-sm" />
        </div>
        <button onClick={handleSearch} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg">Search</button>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Title</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Category</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Source</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Active</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-b border-[#0f172a] hover:bg-[#334155]/30">
                <td className="px-4 py-3 text-slate-200">{a.title}</td>
                <td className="px-4 py-3"><Badge className="bg-blue-500/20 text-blue-400">{a.category}</Badge></td>
                <td className="px-4 py-3 text-slate-400">{a.sourceType}</td>
                <td className="px-4 py-3"><Badge className={a.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}>{a.isActive ? 'Yes' : 'No'}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(a)} className="text-indigo-400 hover:text-indigo-300 text-xs mr-3">Edit</button>
                  <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No articles found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Article' : 'New Article'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm resize-y" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Source Type</label>
              <select value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm">
                <option value="text">Text</option>
                <option value="url">URL</option>
                <option value="file">File</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm" />
          </div>
          <button onClick={handleSave} className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-sm">
            {editId ? 'Update Article' : 'Create Article'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
