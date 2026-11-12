'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';

export default function ConversationsPage() {
  const [data, setData] = useState<any>({ references: [] });
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [assign, setAssign] = useState({ conversationId: '', toUserId: '', toTeamId: '', reason: '' });
  useEffect(() => {
    apiFetch('/api/v1/conversations').then(setData).catch(()=>{});
    apiFetch('/api/v1/clients').then((r:any)=>setClients(r.items||[])).catch(()=>{});
    apiFetch('/api/v1/users').then(setUsers).catch(()=>{});
    apiFetch('/api/v1/teams').then(setTeams).catch(()=>{});
  }, []);
  async function doAssign(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/conversations/assign', { method: 'POST', body: JSON.stringify({ conversationId: assign.conversationId, toUserId: assign.toUserId || undefined, toTeamId: assign.toTeamId || undefined, reason: assign.reason }) });
    apiFetch('/api/v1/conversations').then(setData);
  }
  async function linkClient(convId: string, clientId: string) {
    await apiFetch('/api/v1/conversations/link-client', { method: 'POST', body: JSON.stringify({ conversationId: convId, clientId }) });
    apiFetch('/api/v1/conversations').then(setData);
  }
  const refs = data.references || [];
  return (
    <div className="space-y-6">
      <PageHeader title="Conversaciones" description="Gestión integrada de conversaciones de Chatwoot. Asignación, vinculación con clientes y seguimiento." />
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Total" value={refs.length} />
        <KpiCard title="Abiertas" value={refs.filter((r:any)=>r.status==='open').length} color="text-blue-600" />
        <KpiCard title="Pendientes" value={refs.filter((r:any)=>r.status==='pending').length} color="text-amber-600" />
        <KpiCard title="Resueltas" value={refs.filter((r:any)=>r.status==='resolved').length} color="text-green-600" />
      </div>
      <form onSubmit={doAssign} className="bg-slate-800 border border-slate-700 rounded-xl p-4 grid gap-3 md:grid-cols-4 shadow-sm">
        <select className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50 text-sm" value={assign.conversationId} onChange={e=>setAssign({...assign,conversationId:e.target.value})} required>
          <option value="">Conversación</option>
          {refs.map((r:any)=><option key={r.id} value={r.id}>#{r.chatwootConversationId} ({r.status})</option>)}
        </select>
        <select className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50 text-sm" value={assign.toUserId} onChange={e=>setAssign({...assign,toUserId:e.target.value})}>
          <option value="">Operador</option>
          {users.map((u:any)=><option key={u.id} value={u.id}>{u.email}</option>)}
        </select>
        <select className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50 text-sm" value={assign.toTeamId} onChange={e=>setAssign({...assign,toTeamId:e.target.value})}>
          <option value="">Equipo</option>
          {teams.map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50 text-sm" placeholder="Motivo" value={assign.reason} onChange={e=>setAssign({...assign,reason:e.target.value})} />
        <button className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm md:col-span-4 hover:bg-indigo-700">Asignar</button>
      </form>
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50"><tr><th className="p-3 text-left font-semibold text-slate-300">CW ID</th><th className="p-3 text-left font-semibold text-slate-300">Estado</th><th className="p-3 text-left font-semibold text-slate-300">Asignado</th><th className="p-3 text-left font-semibold text-slate-300">Equipo</th><th className="p-3 text-left font-semibold text-slate-300">Cliente</th></tr></thead>
          <tbody>
            {refs.map((r:any)=>(
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-700/50">
                <td className="p-3 font-medium">#{r.chatwootConversationId}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status==='open'?'bg-blue-100 text-blue-700':r.status==='resolved'?'bg-green-100 text-green-700':'bg-slate-100 text-slate-300'}`}>{r.status}</span></td>
                <td className="p-3">{r.localAssignee?.email || '-'}</td>
                <td className="p-3">{r.localTeam?.name || '-'}</td>
                <td className="p-3">
                  <select className="text-xs border border-slate-700 rounded bg-slate-700/50 px-2 py-1" value={r.clientId || ''} onChange={e=>linkClient(r.id, e.target.value)}>
                    <option value="">Sin cliente</option>
                    {clients.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {refs.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">Sin conversaciones sincronizadas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
