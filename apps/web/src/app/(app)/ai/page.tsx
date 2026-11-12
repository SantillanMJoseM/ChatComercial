'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AIPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [pform, setPform] = useState({ key: '', name: '', type: 'openai', baseUrl: '', apiKey: '' });
  const [aform, setAform] = useState({ key: '', name: '', providerKey: '', modelId: '', systemPrompt: 'Eres un asistente comercial.', mode: 'assist' });
  const [models, setModels] = useState<any[]>([]);
  const [chat, setChat] = useState({ assistantKey: '', message: '', result: '' });

  async function load() {
    setProviders(await apiFetch('/api/v1/ai/providers').catch(()=>[]));
    setAssistants(await apiFetch('/api/v1/ai/assistants').catch(()=>[]));
    setModels(await apiFetch('/api/v1/ai/models').catch(()=>[]));
  }
  useEffect(() => { load(); }, []);

  async function createProvider(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/ai/providers', { method: 'POST', body: JSON.stringify({ ...pform, isActive: true }) });
    setPform({ key: '', name: '', type: 'openai', baseUrl: '', apiKey: '' }); load();
  }
  async function createModel(e: React.FormEvent) {
    e.preventDefault();
    const providerKey = prompt('Provider key?');
    const modelId = prompt('Model id (ej. gpt-4o-mini)?');
    if (!providerKey || !modelId) return;
    await apiFetch('/api/v1/ai/models', { method: 'POST', body: JSON.stringify({ providerKey, modelId, displayName: modelId, capabilities: { chat: true }, isActive: true }) });
    load();
  }
  async function createAssistant(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/ai/assistants', { method: 'POST', body: JSON.stringify({ ...aform, isActive: true }) });
    setAform({ key: '', name: '', providerKey: '', modelId: '', systemPrompt: 'Eres un asistente comercial.', mode: 'assist' }); load();
  }
  const [chatLoading, setChatLoading] = useState(false);
  async function runChat(e: React.FormEvent) {
    e.preventDefault();
    setChatLoading(true);
    try {
      const r = await apiFetch('/api/v1/ai/execute', { method: 'POST', body: JSON.stringify({ assistantKey: chat.assistantKey, messages: [{ role: 'user', content: chat.message }] }) });
      setChat({ ...chat, result: r.content });
    } catch (err: any) {
      setChat({ ...chat, result: 'Error: ' + (err.message || 'No se pudo ejecutar') });
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Proveedores</h3>
        <form onSubmit={createProvider} className="grid gap-2 md:grid-cols-4 mb-3">
          <input className="px-3 py-2 border border-border rounded-md bg-background text-sm" placeholder="key" value={pform.key} onChange={e=>setPform({...pform,key:e.target.value})} required />
          <input className="px-3 py-2 border border-border rounded-md bg-background text-sm" placeholder="nombre" value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})} required />
          <select className="px-3 py-2 border border-border rounded-md bg-background text-sm" value={pform.type} onChange={e=>setPform({...pform,type:e.target.value})}>
          <option value="openai">openai</option><option value="anthropic">anthropic</option><option value="deepseek">deepseek</option><option value="openai-compatible">openai-compatible</option>
        </select>
        <input className="px-3 py-2 border border-border rounded-md bg-background text-sm" placeholder="base URL" value={pform.baseUrl} onChange={e=>setPform({...pform,baseUrl:e.target.value})} required />
          <input className="px-3 py-2 border border-border rounded-md bg-background text-sm" placeholder="API key" type="password" value={pform.apiKey} onChange={e=>setPform({...pform,apiKey:e.target.value})} required />
          <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm md:col-span-4">Crear proveedor</button>
        </form>
        <ul className="text-sm">{providers.map((p:any)=><li key={p.key}>{p.name} ({p.key}) - {p.isActive?'activo':'inactivo'}</li>)}</ul>
        <button onClick={createModel} className="mt-2 text-xs text-primary hover:underline">+ Registrar modelo (prompt)</button>
      </section>

      <section className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Asistentes</h3>
        <form onSubmit={createAssistant} className="grid gap-2 md:grid-cols-3 mb-3">
          <input className="px-3 py-2 border border-border rounded-md bg-background text-sm" placeholder="key" value={aform.key} onChange={e=>setAform({...aform,key:e.target.value})} required />
          <input className="px-3 py-2 border border-border rounded-md bg-background text-sm" placeholder="nombre" value={aform.name} onChange={e=>setAform({...aform,name:e.target.value})} required />
          <select className="px-3 py-2 border border-border rounded-md bg-background text-sm" value={aform.providerKey} onChange={e=>setAform({...aform,providerKey:e.target.value})} required>
            <option value="">Proveedor</option>
            {providers.map((p:any)=><option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
          <select className="px-3 py-2 border border-border rounded-md bg-background text-sm" value={aform.modelId} onChange={e=>setAform({...aform,modelId:e.target.value})} required>
            <option value="">Modelo</option>
            {models.map((m:any)=><option key={m.id} value={m.id}>{m.displayName}</option>)}
          </select>
          <select className="px-3 py-2 border border-border rounded-md bg-background text-sm" value={aform.mode} onChange={e=>setAform({...aform,mode:e.target.value})}>
            <option value="disabled">disabled</option><option value="assist">assist</option><option value="approval">approval</option><option value="auto">auto</option>
          </select>
          <textarea className="px-3 py-2 border border-border rounded-md bg-background text-sm md:col-span-3" value={aform.systemPrompt} onChange={e=>setAform({...aform,systemPrompt:e.target.value})} />
          <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm md:col-span-3">Crear asistente</button>
        </form>
        <ul className="text-sm">{assistants.map((a:any)=><li key={a.key}>{a.name} ({a.key}) - {a.mode}</li>)}</ul>
      </section>

      <section className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Probar asistente</h3>
        <form onSubmit={runChat} className="space-y-2">
          <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={chat.assistantKey} onChange={e=>setChat({...chat,assistantKey:e.target.value})} required>
            <option value="">Asistente</option>
            {assistants.map((a:any)=><option key={a.key} value={a.key}>{a.name}</option>)}
          </select>
          <textarea className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={chat.message} onChange={e=>setChat({...chat,message:e.target.value})} placeholder="Mensaje" required />
          <button disabled={chatLoading} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-50">{chatLoading ? "Ejecutando..." : "Ejecutar"}</button>
        </form>
        {chat.result && <div className="mt-3 text-sm whitespace-pre-wrap bg-muted p-3 rounded">{chat.result}</div>}
      </section>
    </div>
  );
}
