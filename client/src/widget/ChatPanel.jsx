import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ api, config, sessionKey, setSessionKey }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ticketSuggestion, setTicketSuggestion] = useState(null);
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketCreated, setTicketCreated] = useState(null);
  const bottomRef = useRef(null);

  const accent = config?.brandConfig?.accent || '#4F46E5';
  const greeting = config?.botConfig?.greeting || 'Hello! How can I help you today?';
  const botName = config?.botConfig?.name || 'Support Bot';

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, ticketSuggestion]);

  // Restore session on mount
  useEffect(() => {
    if (sessionKey) {
      api.getHistory(sessionKey).then((data) => {
        if (data.messages?.length) {
          setMessages(data.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })));
        }
      }).catch(() => {});
    }
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);
    setTicketSuggestion(null);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await api.sendMessage({
        message: text,
        sessionKey: sessionKey || undefined,
      });

      if (res.sessionKey && !sessionKey) {
        setSessionKey(res.sessionKey);
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: res.message.content }]);

      if (res.ticketSuggestion) {
        setTicketSuggestion(res.ticketSuggestion);
      }
    } catch (err) {
      if (err.rateLimited) {
        setError(`Rate limited. Try again in ${err.retryAfter}s`);
      } else {
        setError(err.message || 'Failed to send message');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketEmail || !ticketSuggestion) return;
    try {
      const res = await api.createTicket({
        sessionKey,
        email: ticketEmail,
        subject: ticketSuggestion.subject,
        description: ticketSuggestion.description,
        category: ticketSuggestion.category,
        priority: ticketSuggestion.priority,
      });
      setTicketCreated(res.ticket?.ticketNo || 'Created');
      setTicketSuggestion(null);
    } catch {
      setError('Failed to create ticket');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        {/* Greeting */}
        {messages.length === 0 && (
          <div style={{
            background: '#f1f5f9', borderRadius: '16px 16px 16px 4px',
            padding: '12px 16px', maxWidth: '85%', fontSize: '14px',
            color: '#334155', lineHeight: '1.5',
          }}>
            {greeting}
          </div>
        )}

        {messages.filter(m => m.role !== 'system').map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
          }}>
            <div style={{
              background: m.role === 'user' ? accent : '#f1f5f9',
              color: m.role === 'user' ? '#fff' : '#334155',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding: '12px 16px', fontSize: '14px', lineHeight: '1.5',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{
            alignSelf: 'flex-start', background: '#f1f5f9',
            borderRadius: '16px 16px 16px 4px', padding: '12px 16px',
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#94a3b8',
                  animation: `sh-bounce 1.2s ${i * 0.2}s infinite ease-in-out`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Ticket suggestion */}
        {ticketSuggestion && !ticketCreated && (
          <div style={{
            background: '#fef3c7', border: '1px solid #fbbf24',
            borderRadius: '12px', padding: '12px', fontSize: '13px',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#92400e' }}>
              Create a support ticket?
            </div>
            <div style={{ color: '#78350f', marginBottom: '8px' }}>
              <strong>{ticketSuggestion.subject}</strong>
            </div>
            <input
              type="email"
              placeholder="Your email"
              value={ticketEmail}
              onChange={(e) => setTicketEmail(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: '1px solid #d1d5db', fontSize: '13px',
                marginBottom: '8px', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCreateTicket} style={{
                flex: 1, padding: '8px', borderRadius: '8px',
                background: accent, color: '#fff', border: 'none',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>Create Ticket</button>
              <button onClick={() => setTicketSuggestion(null)} style={{
                padding: '8px 12px', borderRadius: '8px',
                background: '#e5e7eb', color: '#374151', border: 'none',
                fontSize: '13px', cursor: 'pointer',
              }}>Dismiss</button>
            </div>
          </div>
        )}

        {ticketCreated && (
          <div style={{
            background: '#d1fae5', border: '1px solid #34d399',
            borderRadius: '12px', padding: '12px', fontSize: '13px',
            color: '#065f46',
          }}>
            Ticket <strong>{ticketCreated}</strong> created successfully!
          </div>
        )}

        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #f87171',
            borderRadius: '12px', padding: '12px', fontSize: '13px',
            color: '#991b1b',
          }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid #e2e8f0',
        display: 'flex', gap: '8px', background: '#fff',
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Type a message..."
          disabled={loading}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '24px',
            border: '1px solid #d1d5db', fontSize: '14px',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 18px', borderRadius: '24px',
            background: loading || !input.trim() ? '#cbd5e1' : accent,
            color: '#fff', border: 'none', fontSize: '14px',
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
