'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ReportsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', query: {} });
  useEffect(() => { apiFetch('/api/v1/reports').then(setItems).catch(()=>{}); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/reports', { method: 'POST', body: JSON.stringify({ name: form.name, description: form.description, query: form.query }) });
    setForm({ name: '', description: '', query: {} });
    apiFetch('/api/v1/reports').then(setItems);
  }
  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-card border border-border rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Nombre reporte" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Descripción" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2">Crear reporte</button>
      </form>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Descripción</th></tr></thead>
          <tbody>
            {items.map((r:any)=>(<tr key={r.id} className="border-t border-border"><td className="p-3">{r.name}</td><td className="p-3">{r.description}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
