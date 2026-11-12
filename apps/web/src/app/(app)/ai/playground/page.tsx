'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function PlaygroundPage() {
  const [assistants, setAssistants] = useState<any[]>([]);
  const [form, setForm] = useState({ assistantKey: '', query: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  useEffect(() => { apiFetch('/api/v1/ai/assistants').then(setAssistants).catch(()=>{}); }, []);
  async function run(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setResult(null);
    const sid = sessionId || (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    if (!sessionId) setSessionId(sid);
    try { setResult(await apiFetch('/api/v1/ai/grounded', { method: 'POST', body: JSON.stringify({ assistantKey: form.assistantKey, query: form.query, sessionId: sid }) })); }
    catch (err: any) { setResult({ error: err.message }); }
    finally { setLoading(false); }
  }
  return (
    <div className="space-y-4">
      <form onSubmit={run} className="bg-card border border-border rounded-xl p-4 space-y-3">
        <select className="w-full px-3 py-2 border border-border rounded-md bg-background" value={form.assistantKey} onChange={e=>setForm({...form,assistantKey:e.target.value})} required>
          <option value="">Asistente</option>
          {assistants.map((a:any)=><option key={a.key} value={a.key}>{a.name}</option>)}
        </select>
        <textarea className="w-full px-3 py-2 border border-border rounded-md bg-background" rows={4} value={form.query} onChange={e=>setForm({...form,query:e.target.value})} placeholder="Consulta" required />
        <button disabled={loading} className="bg-primary text-primary-foreground rounded-md px-4 py-2 disabled:opacity-50">{loading?'Ejecutando...':'Ejecutar'}</button>
      </form>
      {result && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="text-sm"><span className="font-semibold">Estado:</span> {result.status} · <span className="font-semibold">Fundamentado:</span> {String(result.grounded)}</div>
          <div className="whitespace-pre-wrap text-sm">{result.answer}</div>
          {result.citations?.length ? (
            <div>
              <div className="font-semibold text-sm mb-1">Fuentes</div>
              <ul className="text-xs space-y-1">{result.citations.map((c:any)=><li key={c.ref}>[{c.ref}] {c.documentName || c.documentId} (chunk {c.chunkId?.slice(0,8)})</li>)}</ul>
            </div>
          ) : null}
          <div className="text-xs text-slate-400">Tokens: {result.tokenUsage?.inputTokens}/{result.tokenUsage?.outputTokens} · Latencia: {result.latencyMs}ms · {result.provider}/{result.model}</div>
          {result.warnings?.length ? <div className="text-xs text-red-600">{result.warnings.join(', ')}</div> : null}
        </div>
      )}
    </div>
  );
}
