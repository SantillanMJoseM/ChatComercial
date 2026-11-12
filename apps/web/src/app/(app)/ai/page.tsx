'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';

export default function AIPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [pform, setPform] = useState({ key: '', name: '', type: 'openai', baseUrl: '', apiKey: '' });
  const [aform, setAform] = useState({ key: '', name: '', providerKey: '', modelId: '', systemPrompt: 'Eres un asistente comercial.', mode: 'assist' });
  const [chat, setChat] = useState({ assistantKey: '', message: '', result: '' });
  const [sessionId, setSessionId] = useState<string>('');
  const [lastAssistant, setLastAssistant] = useState<string>('');
  const [chatLoading, setChatLoading] = useState(false);

  async function load() {
    setProviders(await apiFetch('/api/v1/ai/providers').catch(() => []));
    setAssistants(await apiFetch('/api/v1/ai/assistants').catch(() => []));
    setModels(await apiFetch('/api/v1/ai/models').catch(() => []));
  }
  useEffect(() => { load(); }, []);

  async function createProvider(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/ai/providers', { method: 'POST', body: JSON.stringify({ ...pform, isActive: true }) });
    setPform({ key: '', name: '', type: 'openai', baseUrl: '', apiKey: '' });
    load();
  }
  async function createModel() {
    const providerKey = prompt('Provider key?');
    const modelId = prompt('Model id (ej. gpt-4o-mini)?');
    if (!providerKey || !modelId) return;
    await apiFetch('/api/v1/ai/models', { method: 'POST', body: JSON.stringify({ providerKey, modelId, displayName: modelId, capabilities: { chat: true }, isActive: true }) });
    load();
  }
  async function createAssistant(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/ai/assistants', { method: 'POST', body: JSON.stringify({ ...aform, isActive: true }) });
    setAform({ key: '', name: '', providerKey: '', modelId: '', systemPrompt: 'Eres un asistente comercial.', mode: 'assist' });
    load();
  }
  async function runChat(e: React.FormEvent) {
    e.preventDefault();
    let sid = sessionId;
    if (!sid || lastAssistant !== chat.assistantKey) { sid = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2); setSessionId(sid); setLastAssistant(chat.assistantKey); }
    setChatLoading(true);
    try {
      const r = await apiFetch('/api/v1/ai/execute', { method: 'POST', body: JSON.stringify({ assistantKey: chat.assistantKey, messages: [{ role: 'user', content: chat.message }], sessionId: sid }) });
      setChat({ ...chat, result: r.content });
    } catch (err: any) {
      setChat({ ...chat, result: 'Error: ' + (err.message || 'No se pudo ejecutar') });
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Inteligencia artificial" description="Proveedores, modelos y asistentes configurables. Gestión de credenciales y pruebas de ejecución." />
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Proveedores" value={providers.length} />
        <KpiCard title="Modelos" value={models.length} />
        <KpiCard title="Asistentes" value={assistants.length} />
      </div>
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold mb-3 text-slate-800">Proveedores</h3>
        <form onSubmit={createProvider} className="grid gap-2 md:grid-cols-5 mb-4">
          <input className="px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm" placeholder="key" value={pform.key} onChange={e => setPform({ ...pform, key: e.target.value })} required />
          <input className="px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm" placeholder="nombre" value={pform.name} onChange={e => setPform({ ...pform, name: e.target.value })} required />
          <select className="px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm" value={pform.type} onChange={e => setPform({ ...pform, type: e.target.value })}>
            <option value="openai">openai</option><option value="anthropic">anthropic</option><option value="deepseek">deepseek</option><option value="openai-compatible">openai-compatible</option>
          </select>
          <input className="px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm" placeholder="base URL" value={pform.baseUrl} onChange={e => setPform({ ...pform, baseUrl: e.target.value })} required />
          <input className="px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm" placeholder="API key" type="password" value={pform.apiKey} onChange={e => setPform({ ...pform, apiKey: e.target.value })} required />
          <button className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm md:col-span-5 hover:bg-indigo-700">Crear proveedor</button>
        </form>
        <ul className="text-sm space-y-2">
          {providers.map((p: any) => (
            <li key={p.key} className="flex items-center justify-between border-b border-slate-100 pb-1">
              <span>{p.name} ({p.key}) — {p.type} — {p.isActive ? 'activo' : 'inactivo'} — estado: {p.status || 'not_checked'}{p.lastLatencyMs ? ` · ${p.lastLatencyMs}ms` : ''}</span>
              <button onClick={async () => { try { await apiFetch(`/api/v1/ai/providers/${p.key}/test`, { method: 'POST' }); load(); } catch {} }} className="text-xs text-indigo-600 hover:underline">Probar conexión</button>
            </li>
          ))}
        </ul>
        <button onClick={createModel} className="mt-3 text-xs text-indigo-600 hover:underline">+ Registrar modelo</button>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold mb-3 text-slate-800">Asistentes</h3>
        <form onSubmit={createAssistant} className="grid gap-2 md:grid-cols-3 mb-3">
          <input className="px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm" placeholder="key" value={aform.key} onChange={e => setAform({ ...aform, key: e.target.value })} required />
          <input className="px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm" placeholder="nombre" value={aform.name} onChange={e => setAform({ ...aform, name: e.target.value })} required />
          <select className="px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm" value={aform.providerKey} onChange={e => setAform({ ...aform, providerKey: e.target.value })} required>
            <option value="">Proveedor</option>
            {providers.map((p: any) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
          <select className="px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm" value={aform.modelId} onChange={e => setAform({ ...aform, modelId: e.target.value })} required>
            <option value="">Modelo</option>
            {models.map((m: any) => <option key={m.id} value={m.id}>{m.displayName}</option>)}
          </select>
          <select className="px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm" value={aform.mode} onChange={e => setAform({ ...aform, mode: e.target.value })}>
            <option value="disabled">disabled</option><option value="assist">assist</option><option value="approval">approval</option><option value="auto">auto</option>
          </select>
          <textarea className="px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm md:col-span-3" rows={3} value={aform.systemPrompt} onChange={e => setAform({ ...aform, systemPrompt: e.target.value })} />
          <button className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm md:col-span-3 hover:bg-indigo-700">Crear asistente</button>
        </form>
        <ul className="text-sm space-y-1">{assistants.map((a: any) => <li key={a.key}>{a.name} ({a.key}) — {a.mode} — {a.provider?.name}</li>)}</ul>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold mb-3 text-slate-800">Probar asistente</h3>
        <form onSubmit={runChat} className="space-y-3">
          <select className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm" value={chat.assistantKey} onChange={e => setChat({ ...chat, assistantKey: e.target.value })} required>
            <option value="">Asistente</option>
            {assistants.map((a: any) => <option key={a.key} value={a.key}>{a.name}</option>)}
          </select>
          <textarea className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm" rows={4} value={chat.message} onChange={e => setChat({ ...chat, message: e.target.value })} placeholder="Mensaje" required />
          <button disabled={chatLoading} className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50 hover:bg-indigo-700">{chatLoading ? 'Ejecutando...' : 'Ejecutar'}</button>
        </form>
        {chat.result && <div className="mt-3 text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded border border-slate-200">{chat.result}</div>}
      </section>
    </div>
  );
}
