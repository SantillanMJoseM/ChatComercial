'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

export default function SkillsPage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [form, setForm] = useState({ key: '', name: '', description: '', category: '', objective: '' });
  useEffect(() => { apiFetch('/api/v1/skills').then(setSkills).catch(()=>{}); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/skills', { method: 'POST', body: JSON.stringify(form) });
    setForm({ key: '', name: '', description: '', category: '', objective: '' });
    apiFetch('/api/v1/skills').then(setSkills);
  }
  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-card border border-border rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="key" value={form.key} onChange={e=>setForm({...form,key:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="categoría" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
        <input className="px-3 py-2 border border-border rounded-md bg-background md:col-span-2" placeholder="descripción" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2">Crear skill</button>
      </form>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-left">Key</th><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Modo</th><th className="p-3 text-left">Versión</th><th className="p-3 text-left">Acción</th></tr></thead>
          <tbody>
            {skills.map((s:any)=>(
              <tr key={s.key} className="border-t border-border">
                <td className="p-3">{s.key}</td><td className="p-3">{s.name}</td><td className="p-3">{s.status}</td><td className="p-3">{s.executionMode}</td>
                <td className="p-3">{s.publishedVersionId?.slice(0,8) || '-'}</td>
                <td className="p-3"><Link href={`/skills/${s.key}`} className="text-primary text-xs hover:underline">Gestionar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
