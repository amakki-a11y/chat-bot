import { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';
import FAQPanel from './FAQPanel';
import TicketPanel from './TicketPanel';

const TABS = { chat: 'Chat', faq: 'FAQ', ticket: 'Ticket' };

export default function SupportWidget({ api }) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [sessionKey, setSessionKey] = useState(
    () => localStorage.getItem('sh_session') || null
  );
  const [loading, setLoading] = useState(true);

  // Persist session key
  useEffect(() => {
    if (sessionKey) localStorage.setItem('sh_session', sessionKey);
  }, [sessionKey]);

  // Load config on mount
  useEffect(() => {
    api.getConfig()
      .then(setConfig)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const accent = config?.brandConfig?.accent || '#4F46E5';
  const botName = config?.botConfig?.name || 'Support';
  const channels = config?.channelConfig || {};

  // Build visible tabs based on channel config
  const visibleTabs = [];
  if (channels.chat !== false) visibleTabs.push('chat');
  if (channels.faq) visibleTabs.push('faq');
  if (channels.tickets) visibleTabs.push('ticket');

  // If current tab is not visible, switch to first visible
  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [config]);

  return (
    <>
      {/* Global animations */}
      <style>{`
        @keyframes sh-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes sh-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sh-widget-panel { animation: sh-slide-up 0.25s ease-out; }
      `}</style>

      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
            width: '60px', height: '60px', borderRadius: '50%',
            background: accent, border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s', zIndex: 99999,
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Widget Panel */}
      {open && (
        <div className="sh-widget-panel" style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '380px', height: '560px', borderRadius: '20px',
          background: '#fff', boxShadow: '0 8px 48px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          zIndex: 99999, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          {/* Header */}
          <div style={{
            background: accent, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '16px',
              }}>
                {botName[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>
                  {botName}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                  {loading ? 'Connecting...' : 'Online'}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', cursor: 'pointer', borderRadius: '50%',
              width: '32px', height: '32px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>
              &#10005;
            </button>
          </div>

          {/* Tabs */}
          {visibleTabs.length > 1 && (
            <div style={{
              display: 'flex', borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
            }}>
              {visibleTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '10px 0', border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    fontSize: '13px', fontWeight: activeTab === tab ? 600 : 400,
                    color: activeTab === tab ? accent : '#64748b',
                    borderBottom: activeTab === tab ? `2px solid ${accent}` : '2px solid transparent',
                    transition: 'all 0.2s', fontFamily: 'inherit',
                  }}
                >
                  {TABS[tab]}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#94a3b8', fontSize: '14px',
              }}>
                Loading...
              </div>
            ) : (
              <>
                {activeTab === 'chat' && (
                  <ChatPanel api={api} config={config} sessionKey={sessionKey} setSessionKey={setSessionKey} />
                )}
                {activeTab === 'faq' && (
                  <FAQPanel api={api} config={config} />
                )}
                {activeTab === 'ticket' && (
                  <TicketPanel api={api} config={config} sessionKey={sessionKey} />
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '6px', textAlign: 'center', fontSize: '10px',
            color: '#cbd5e1', borderTop: '1px solid #f1f5f9',
          }}>
            Powered by Support Hub
          </div>
        </div>
      )}
    </>
  );
}
