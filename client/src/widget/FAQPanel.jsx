import { useState, useEffect } from 'react';

export default function FAQPanel({ api, config }) {
  const [faqs, setFaqs] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const accent = config?.brandConfig?.accent || '#4F46E5';

  useEffect(() => {
    api.getFaqs()
      .then((data) => setFaqs(data.faqs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = faqs.filter((f) =>
    f.question.toLowerCase().includes(search.toLowerCase()) ||
    f.answer.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const categories = {};
  filtered.forEach((f) => {
    const cat = f.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(f);
  });

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
        Loading FAQs...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search frequently asked questions..."
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '12px',
            border: '1px solid #d1d5db', fontSize: '14px',
            outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* FAQ List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {Object.keys(categories).length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px', fontSize: '14px' }}>
            {search ? 'No FAQs match your search' : 'No FAQs available'}
          </div>
        ) : (
          Object.entries(categories).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: '8px',
              }}>
                {cat}
              </div>
              {items.map((faq) => (
                <div key={faq.id} style={{
                  marginBottom: '6px', borderRadius: '10px',
                  border: '1px solid #e2e8f0', overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: openId === faq.id ? '#f8fafc' : '#fff',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontSize: '14px', fontWeight: 500, color: '#1e293b',
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', fontFamily: 'inherit',
                    }}
                  >
                    <span>{faq.question}</span>
                    <span style={{
                      transform: openId === faq.id ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s', fontSize: '12px', color: '#94a3b8',
                      flexShrink: 0, marginLeft: '8px',
                    }}>
                      &#9660;
                    </span>
                  </button>
                  {openId === faq.id && (
                    <div style={{
                      padding: '12px 14px', borderTop: '1px solid #e2e8f0',
                      fontSize: '14px', color: '#475569', lineHeight: '1.6',
                      background: '#f8fafc', whiteSpace: 'pre-wrap',
                    }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
