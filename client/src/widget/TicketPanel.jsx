import { useState } from 'react';

export default function TicketPanel({ api, config, sessionKey }) {
  const accent = config?.brandConfig?.accent || '#4F46E5';

  const [form, setForm] = useState({
    email: '', subject: '', description: '',
    category: 'general', priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState(null);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.subject || !form.description) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.createTicket({
        sessionKey: sessionKey || undefined,
        email: form.email,
        subject: form.subject,
        description: form.description,
        category: form.category,
        priority: form.priority,
      });
      setCreated(res.ticket);
    } catch (err) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid #d1d5db', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: '#64748b', marginBottom: '4px', textTransform: 'uppercase',
    letterSpacing: '0.03em',
  };

  if (created) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>&#10003;</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
          Ticket Created!
        </div>
        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
          Your ticket number is:
        </div>
        <div style={{
          display: 'inline-block', padding: '8px 20px', borderRadius: '8px',
          background: '#f1f5f9', fontSize: '16px', fontWeight: 700,
          color: accent, fontFamily: 'monospace',
        }}>
          {created.ticketNo}
        </div>
        <div style={{ marginTop: '16px', fontSize: '13px', color: '#94a3b8' }}>
          We'll get back to you at <strong>{created.email}</strong>
        </div>
        <button onClick={() => { setCreated(null); setForm({ email: '', subject: '', description: '', category: 'general', priority: 'medium' }); }} style={{
          marginTop: '20px', padding: '10px 24px', borderRadius: '10px',
          background: accent, color: '#fff', border: 'none',
          fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
        Submit a Support Ticket
      </div>
      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
        Describe your issue and we'll get back to you.
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Email *</label>
          <input type="email" required value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="you@example.com" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Subject *</label>
          <input required value={form.subject}
            onChange={(e) => update('subject', e.target.value)}
            placeholder="Brief summary of your issue" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Description *</label>
          <textarea required value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Describe your issue in detail..."
            rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Category</label>
            <select value={form.category} onChange={(e) => update('category', e.target.value)}
              style={inputStyle}>
              <option value="general">General</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="shipping">Shipping</option>
              <option value="account">Account</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Priority</label>
            <select value={form.priority} onChange={(e) => update('priority', e.target.value)}
              style={inputStyle}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #f87171',
            borderRadius: '10px', padding: '10px', fontSize: '13px', color: '#991b1b',
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          padding: '12px', borderRadius: '10px',
          background: loading ? '#cbd5e1' : accent, color: '#fff',
          border: 'none', fontSize: '14px', fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}
