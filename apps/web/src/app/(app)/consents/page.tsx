'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ConsentsPage() {
  const [consents, setConsents] = useState<any[]>([]);
  const [form, setForm] = useState({ phoneE164: '', purpose: 'whatsapp_group', status: 'granted', source: 'manual' });
  useEffect(() => { apiFetch('/api/v1/consents').then(setConsents).catch(()=>{}); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/consents', { method: 'POST', body: JSON.stringify(form) });
    apiFetch('/api/v1/consents').then(setConsents);
  }
  async function revoke(id: string) {
    await apiFetch(`/api/v1/consents/${id}/revoke`, { method: 'POST' });
    apiFetch('/api/v1/consents').then(setConsents);
  }
  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-slate-800 border border-slate-700 rounded-xl p-4 grid gap-2 md:grid-cols-4">
        <input className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" placeholder="Teléfono E.164" value={form.phoneE164} onChange={e=>setForm({...form,phoneE164:e.target.value})} required />
        <input className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" placeholder="Propósito" value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} />
        <select className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
          <option value="granted">granted</option><option value="revoked">revoked</option>
        </select>
        <button className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-md px-4 py-2">Registrar</button>
      </form>
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50"><tr><th className="p-3 text-left">Teléfono</th><th className="p-3 text-left">Propósito</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Acción</th></tr></thead>
          <tbody>
            {consents.map((c:any)=>(
              <tr key={c.id} className="border-t border-slate-700">
                <td className="p-3">{c.phoneE164}</td><td className="p-3">{c.purpose}</td><td className="p-3">{c.status}</td>
                <td className="p-3">{c.status==='granted' && <button onClick={()=>revoke(c.id)} className="text-red-600 text-xs">Revocar</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
