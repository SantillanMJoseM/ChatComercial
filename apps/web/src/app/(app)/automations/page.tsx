'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

export default function AutomationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', category: '' });
  useEffect(() => { apiFetch('/api/v1/automations').then(setItems).catch(()=>{}); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/automations', { method: 'POST', body: JSON.stringify(form) });
    setForm({ name: '', description: '', category: '' });
    apiFetch('/api/v1/automations').then(setItems);
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Automatizaciones" description="Reglas y flujos de trabajo comerciales. Crear, publicar y supervisar." />
      <form onSubmit={create} className="bg-white border border-slate-200 rounded-xl p-4 grid gap-3 md:grid-cols-3 shadow-sm">
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Descripción" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Categoría" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 md:col-span-3">Crear automatización</button>
      </form>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Categoría</th></tr></thead>
          <tbody>
            {items.map((a:any)=>(<tr key={a.id} className="border-t border-border"><td className="p-3">{a.name}</td><td className="p-3">{a.status}</td><td className="p-3">{a.category}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
