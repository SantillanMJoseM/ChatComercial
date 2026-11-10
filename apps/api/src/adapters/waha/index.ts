// WAHA adapter - prepared for F1. No actions executed in F0.
export interface WahaAdapterConfig { baseUrl?: string; apiKey?: string; }
export class WahaAdapter {
  constructor(private config: WahaAdapterConfig) {}
  get baseUrl() { return this.config.baseUrl; }
  // F1: implement sendText, sendMedia, createGroup, etc.
}
export function createWahaAdapter() {
  return new WahaAdapter({ baseUrl: process.env.WAHA_BASE_URL });
}
