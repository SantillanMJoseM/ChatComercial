'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function SkillsPage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [form, setForm] = useState({ key: '', name: '', description: '' });
  useEffect(() => { apiFetch('/api/v1/skills').then(setSkills).catch(()=>{}); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/skills', { method: 'POST', body: JSON.stringify(form) });
    setForm({ key: '', name: '', description: '' });
    apiFetch('/api/v1/skills').then(setSkills);
  }
  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-card border border-border rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="key" value={form.key} onChange={e=>setForm({...form,key:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="descripción" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 md:col-span-3">Crear skill</button>
      </form>
      <div className="bg-card border border-border rounded-xl p-4">
        <ul className="text-sm">{skills.map((s:any)=><li key={s.key}>{s.name} ({s.key})</li>)}</ul>
      </div>
    </div>
  );
}
