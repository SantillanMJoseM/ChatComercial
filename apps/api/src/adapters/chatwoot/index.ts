// Chatwoot adapter - prepared for F1. No actions executed in F0.
export interface ChatwootAdapterConfig { baseUrl?: string; apiToken?: string; }
export class ChatwootAdapter {
  constructor(private config: ChatwootAdapterConfig) {}
  get baseUrl() { return this.config.baseUrl; }
}
export function createChatwootAdapter() {
  return new ChatwootAdapter({ baseUrl: process.env.CHATWOOT_BASE_URL });
}
