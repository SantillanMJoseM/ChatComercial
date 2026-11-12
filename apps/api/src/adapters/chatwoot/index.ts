import { env } from '../../config/env';

export class ChatwootAdapter {
  constructor(private baseUrl = env.CHATWOOT_BASE_URL, private token = env.CHATWOOT_API_TOKEN, private accountId = env.CHATWOOT_ACCOUNT_ID) {}

  private headers() { return { 'api_access_token': this.token || '', 'Content-Type': 'application/json' }; }

  async request(path: string, init: RequestInit = {}) {
    if (!this.baseUrl) throw new Error('CHATWOOT_BASE_URL not configured');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers: { ...this.headers(), ...(init.headers || {}) }, signal: ctrl.signal });
      const text = await res.text();
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      if (!res.ok) throw new Error(`Chatwoot ${path} -> ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
      return body;
    } finally { clearTimeout(t); }
  }

  accountPath(p: string) { return `/api/v1/accounts/${this.accountId}${p}`; }

  async profile(): Promise<any> { return this.request('/api/v1/profile'); }
  async inboxes(): Promise<any> { return this.request(this.accountPath('/inboxes')); }
  async agents(): Promise<any> { return this.request(this.accountPath('/agents')); }
  async teams(): Promise<any> { return this.request(this.accountPath('/teams')); }
  async conversations(status?: string): Promise<any> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(this.accountPath(`/conversations${q}`));
  }
  async createContact(payload: any): Promise<any> { return this.request(this.accountPath('/contacts'), { method: 'POST', body: JSON.stringify(payload) }); }
  async createConversation(payload: any): Promise<any> { return this.request(this.accountPath('/conversations'), { method: 'POST', body: JSON.stringify(payload) }); }
  async createInbox(payload: any): Promise<any> { return this.request(this.accountPath('/inboxes'), { method: 'POST', body: JSON.stringify(payload) }); }
}

export function createChatwootAdapter() { return new ChatwootAdapter(); }
