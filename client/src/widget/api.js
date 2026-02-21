/**
 * Widget API client — uses X-API-Key header for authentication.
 */
const API_BASE = '__API_BASE__'; // replaced at build time or inferred

class WidgetAPI {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}/api${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...(options.headers || {}),
      },
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '30';
      throw { rateLimited: true, retryAfter: parseInt(retryAfter) };
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw { status: res.status, message: err.message || 'Request failed' };
    }

    return res.json();
  }

  getConfig() {
    return this.request('/widget/config');
  }

  getFaqs() {
    return this.request('/widget/faqs');
  }

  sendMessage(body) {
    return this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  getHistory(sessionKey) {
    return this.request(`/chat/history/${sessionKey}`);
  }

  createTicket(body) {
    return this.request('/chat/create-ticket', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  escalate(body) {
    return this.request('/chat/escalate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export default WidgetAPI;
