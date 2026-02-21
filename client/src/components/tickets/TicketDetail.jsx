import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/client';
import Badge from '../ui/Badge';
import { priorityColors, statusColors, formatDate } from '../../lib/utils';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.ticket);
      setStatus(res.data.ticket.status);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      await api.post(`/tickets/${id}/reply`, { message: reply, from: 'admin' });
      toast.success('Reply sent');
      setReply('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/tickets/${id}`, { status: newStatus });
      setStatus(newStatus);
      toast.success('Status updated');
    } catch {}
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;
  if (!ticket) return <div className="text-slate-500">Ticket not found</div>;

  const replyColors = { admin: 'border-indigo-500/30 bg-indigo-500/5', customer: 'border-slate-500/30 bg-slate-500/5', ai: 'border-purple-500/30 bg-purple-500/5' };

  return (
    <div>
      <button onClick={() => navigate('/dashboard/tickets')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4">
        <ArrowLeft size={16} /> Back to Tickets
      </button>

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs text-slate-400">{ticket.ticketNo}</span>
              <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
              <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
            </div>
            <h2 className="text-xl font-semibold text-slate-100">{ticket.subject}</h2>
          </div>
          <select value={status} onChange={(e) => handleStatusChange(e.target.value)} className="px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm">
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span className="text-slate-500">Email:</span> <span className="text-slate-200">{ticket.email}</span></div>
          <div><span className="text-slate-500">Category:</span> <span className="text-slate-200">{ticket.category}</span></div>
          <div><span className="text-slate-500">Source:</span> <span className="text-slate-200">{ticket.source}</span></div>
          <div><span className="text-slate-500">Created:</span> <span className="text-slate-200">{formatDate(ticket.createdAt)}</span></div>
        </div>

        {ticket.description && (
          <div className="mt-4 p-3 bg-[#0f172a] rounded-lg text-sm text-slate-300">{ticket.description}</div>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase">Replies ({ticket.replies?.length || 0})</h3>
        {(ticket.replies || []).map((r) => (
          <div key={r.id} className={`border rounded-lg p-4 ${replyColors[r.from] || replyColors.customer}`}>
            <div className="flex items-center justify-between mb-2">
              <Badge className={r.from === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : r.from === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-400'}>
                {r.from}
              </Badge>
              <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>
            </div>
            <p className="text-sm text-slate-200">{r.message}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Type your reply..." className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-100 text-sm resize-y mb-3" />
        <button onClick={handleReply} className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg text-sm">Send Reply</button>
      </div>
    </div>
  );
}
