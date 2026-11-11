'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function SkillsPage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [form, setForm] = useState({ key: '', name: '', description: '', category: '' });
  useEffect(() => { apiFetch('/api/v1/skills').then(setSkills).catch(()=>{}); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/skills', { method: 'POST', body: JSON.stringify(form) });
    setForm({ key: '', name: '', description: '', category: '' });
    apiFetch('/api/v1/skills').then(setSkills);
  }
  async function publish(key: string) {
    const version = prompt('Version number to publish?');
    const versionId = prompt('Version ID?');
    if (!versionId) return;
    await apiFetch(`/api/v1/skills/${key}/publish`, { method: 'POST', body: JSON.stringify({ versionId }) });
    apiFetch('/api/v1/skills').then(setSkills);
  }
  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-card border border-border rounded-xl p-4 grid gap-2 md:grid-cols-4">
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="key" value={form.key} onChange={e=>setForm({...form,key:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="categoría" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="descripción" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 md:col-span-4">Crear skill</button>
      </form>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-left">Key</th><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Modo</th><th className="p-3 text-left">Acción</th></tr></thead>
          <tbody>
            {skills.map((s:any)=>(
              <tr key={s.key} className="border-t border-border">
                <td className="p-3">{s.key}</td><td className="p-3">{s.name}</td><td className="p-3">{s.status}</td><td className="p-3">{s.executionMode}</td>
                <td className="p-3"><button onClick={()=>publish(s.key)} className="text-primary text-xs hover:underline">Publicar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
