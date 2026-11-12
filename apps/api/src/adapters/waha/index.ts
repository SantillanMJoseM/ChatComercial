import { env } from '../../config/env';

export interface WahaSession { name: string; status: string; config?: any; me?: any; }
export interface WahaStatus { version?: string; engine?: string; tier?: string; uptime?: number; }

export class WahaAdapter {
  constructor(private baseUrl = env.WAHA_BASE_URL, private apiKey = env.WAHA_API_KEY) {}

  private headers() { return { 'X-Api-Key': this.apiKey || '', 'Content-Type': 'application/json' }; }

  async request(path: string, init: RequestInit = {}) {
    if (!this.baseUrl) throw new Error('WAHA_BASE_URL not configured');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers: { ...this.headers(), ...(init.headers || {}) }, signal: ctrl.signal });
      const text = await res.text();
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      if (!res.ok) throw new Error(`WAHA ${path} -> ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
      return body;
    } finally { clearTimeout(t); }
  }

  async status(): Promise<WahaStatus> { return this.request('/api/version'); }
  async serverStatus(): Promise<any> { return this.request('/api/server/status'); }
  async sessions(): Promise<WahaSession[]> { return this.request('/api/sessions'); }
  async getSession(name: string): Promise<WahaSession> { return this.request(`/api/sessions/${encodeURIComponent(name)}`); }
  async startSession(name: string): Promise<any> { return this.request('/api/sessions/start', { method: 'POST', body: JSON.stringify({ name }) }); }
  async contacts(session: string): Promise<any> { return this.request(`/api/contacts?session=${encodeURIComponent(session)}`); }
  async getQr(session: string): Promise<{ base64: string; mime: string }> {
    if (!this.baseUrl) throw new Error('WAHA_BASE_URL not configured');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(`${this.baseUrl}/api/${encodeURIComponent(session)}/auth/qr`, { headers: this.headers(), signal: ctrl.signal });
      if (!res.ok) throw new Error(`WAHA qr -> ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      return { base64: buf.toString('base64'), mime: res.headers.get('content-type') || 'image/png' };
    } finally { clearTimeout(t); }
  }

  async sendText(session: string, chatId: string, text: string): Promise<any> {
    return this.request('/api/sendText', { method: 'POST', body: JSON.stringify({ session, chatId, text }) });
  }
}

export function createWahaAdapter() { return new WahaAdapter(); }
