'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function SkillDetailPage() {
  const params = useParams();
  const key = params?.key as string;
  const [skill, setSkill] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [form, setForm] = useState({ version: 1, instructions: '', parameters: {} });
  const [execInput, setExecInput] = useState('{}');
  const [execResult, setExecResult] = useState<any>(null);

  async function load() {
    setSkill(await apiFetch(`/api/v1/skills/${key}`));
    setVersions(await apiFetch(`/api/v1/skills/${key}/versions`));
  }
  useEffect(() => { if (key) load(); }, [key]);

  async function createVersion(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch(`/api/v1/skills/${key}/versions`, { method: 'POST', body: JSON.stringify({ version: form.version, instructions: form.instructions, parameters: form.parameters }) });
    load();
  }
  async function publish(versionId: string) {
    await apiFetch(`/api/v1/skills/${key}/publish`, { method: 'POST', body: JSON.stringify({ versionId }) });
    load();
  }
  async function setMode(mode: string) {
    await apiFetch(`/api/v1/skills/${key}`, { method: 'PATCH', body: JSON.stringify({ executionMode: mode }) });
    load();
  }
  async function disable() {
    await apiFetch(`/api/v1/skills/${key}/disable`, { method: 'POST' });
    load();
  }
  async function execute(e: React.FormEvent) {
    e.preventDefault();
    const input = JSON.parse(execInput || '{}');
    const r = await apiFetch(`/api/v1/skills/${key}/execute`, { method: 'POST', body: JSON.stringify({ input }) });
    setExecResult(r);
  }

  if (!skill) return <div>Cargando...</div>;
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold">{skill.name}</h2>
        <div className="text-sm text-slate-400">{skill.key} · {skill.status} · modo: {skill.executionMode}</div>
        <div className="mt-3 flex gap-2">
          <button onClick={()=>setMode('disabled')} className="px-3 py-1 border border-border rounded text-xs">Disabled</button>
          <button onClick={()=>setMode('assist')} className="px-3 py-1 border border-border rounded text-xs">Assist</button>
          <button onClick={()=>setMode('auto')} className="px-3 py-1 border border-border rounded text-xs text-red-600">Auto</button>
          <button onClick={disable} className="px-3 py-1 border border-border rounded text-xs text-red-600">Deshabilitar</button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-2">Nueva versión</h3>
        <form onSubmit={createVersion} className="space-y-2">
          <input className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" type="number" value={form.version} onChange={e=>setForm({...form,version:Number(e.target.value)})} required />
          <textarea className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" rows={4} value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})} placeholder="Instrucciones" required />
          <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm">Crear versión (draft)</button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-2">Versiones</h3>
        <ul className="text-sm space-y-2">
          {versions.map((v:any)=>(
            <li key={v.id} className="border-b border-border pb-2">
              <div>v{v.version} · {v.status}</div>
              <div className="text-xs text-slate-400">{v.instructions?.slice(0,80)}</div>
              {v.status==='draft' && <button onClick={()=>publish(v.id)} className="text-primary text-xs hover:underline mt-1">Publicar</button>}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-2">Probar skill</h3>
        <form onSubmit={execute} className="space-y-2">
          <textarea className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" rows={3} value={execInput} onChange={e=>setExecInput(e.target.value)} />
          <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm">Ejecutar</button>
        </form>
        {execResult && <pre className="mt-3 text-xs bg-slate-700 p-2 rounded">{JSON.stringify(execResult,null,2)}</pre>}
      </div>
    </div>
  );
}
