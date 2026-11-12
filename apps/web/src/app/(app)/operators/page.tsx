'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

export default function OperatorsPage() {
  const [operators, setOperators] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ userId: '', availability: 'online', chatwootAgentId: '' });
  useEffect(() => {
    apiFetch('/api/v1/operators').then(setOperators).catch(()=>{});
    apiFetch('/api/v1/users').then(setUsers).catch(()=>{});
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/operators', { method: 'POST', body: JSON.stringify({ userId: form.userId, availability: form.availability, chatwootAgentId: form.chatwootAgentId ? Number(form.chatwootAgentId) : undefined }) });
    apiFetch('/api/v1/operators').then(setOperators);
  }
  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-slate-800 border border-slate-700 rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <select className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" value={form.userId} onChange={e=>setForm({...form,userId:e.target.value})} required>
          <option value="">Usuario</option>
          {users.map((u:any)=><option key={u.id} value={u.id}>{u.email}</option>)}
        </select>
        <select className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" value={form.availability} onChange={e=>setForm({...form,availability:e.target.value})}>
          <option value="online">online</option><option value="offline">offline</option><option value="busy">busy</option>
        </select>
        <input className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" placeholder="Chatwoot Agent ID" value={form.chatwootAgentId} onChange={e=>setForm({...form,chatwootAgentId:e.target.value})} />
        <button className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-md px-4 py-2">Crear perfil</button>
      </form>
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50"><tr><th className="p-3 text-left">Usuario</th><th className="p-3 text-left">Disponibilidad</th><th className="p-3 text-left">Chatwoot Agent</th></tr></thead>
          <tbody>
            {operators.map((o:any)=>(
              <tr key={o.id} className="border-t border-slate-700">
                <td className="p-3">{o.user?.email}</td><td className="p-3">{o.availability}</td><td className="p-3">{o.chatwootAgentId ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
