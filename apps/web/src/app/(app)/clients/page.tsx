'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', taxId: '', notes: '' });
  const [error, setError] = useState('');

  async function load() { const r = await apiFetch('/api/v1/clients'); setClients(r.items || []); }
  useEffect(() => { load().catch((e)=>setError(e.message)); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setError('');
    try { await apiFetch('/api/v1/clients', { method: 'POST', body: JSON.stringify(form) }); setForm({ name: '', phone: '', email: '', taxId: '', notes: '' }); load(); }
    catch (err: any) { setError(err.message); }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-card border border-border rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Teléfono" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="CUIT/DNI" value={form.taxId} onChange={e=>setForm({...form,taxId:e.target.value})} />
        <input className="px-3 py-2 border border-border rounded-md bg-background md:col-span-2" placeholder="Notas" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2">Crear cliente</button>
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Teléfono</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Estado</th></tr></thead>
          <tbody>
            {clients.map((c:any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">{c.name}</td><td className="p-3">{c.phone}</td><td className="p-3">{c.email}</td><td className="p-3">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
