'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ clientId: '', firstName: '', lastName: '', whatsapp: '', email: '', isPrimary: false });
  useEffect(() => {
    apiFetch('/api/v1/contacts').then(setContacts).catch(()=>{});
    apiFetch('/api/v1/clients').then((r:any)=>setClients(r.items||[])).catch(()=>{});
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/contacts', { method: 'POST', body: JSON.stringify({ ...form, phones: [] }) });
    const r = await apiFetch('/api/v1/contacts'); setContacts(r);
    setForm({ clientId: '', firstName: '', lastName: '', whatsapp: '', email: '', isPrimary: false });
  }
  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-slate-800 border border-slate-700 rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <select className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" value={form.clientId} onChange={e=>setForm({...form,clientId:e.target.value})} required>
          <option value="">Cliente</option>
          {clients.map((c:any)=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" placeholder="Nombre" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required />
        <input className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" placeholder="Apellido" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} />
        <input className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" placeholder="WhatsApp" value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} />
        <input className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPrimary} onChange={e=>setForm({...form,isPrimary:e.target.checked})} /> Principal</label>
        <button className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-md px-4 py-2">Crear contacto</button>
      </form>
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50"><tr><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">WhatsApp</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Principal</th></tr></thead>
          <tbody>
            {contacts.map((c:any)=>(
              <tr key={c.id} className="border-t border-slate-700">
                <td className="p-3">{c.firstName} {c.lastName}</td><td className="p-3">{c.whatsapp}</td><td className="p-3">{c.email}</td><td className="p-3">{c.isPrimary?'Sí':'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
