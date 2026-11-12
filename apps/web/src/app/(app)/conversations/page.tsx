'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

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
  return (
    <div className="space-y-4">
      <form onSubmit={doAssign} className="bg-card border border-border rounded-xl p-4 grid gap-2 md:grid-cols-4">
        <select className="px-3 py-2 border border-border rounded-md bg-background" value={assign.conversationId} onChange={e=>setAssign({...assign,conversationId:e.target.value})} required>
          <option value="">Conversación</option>
          {(data.references||[]).map((r:any)=><option key={r.id} value={r.id}>#{r.chatwootConversationId} ({r.status})</option>)}
        </select>
        <select className="px-3 py-2 border border-border rounded-md bg-background" value={assign.toUserId} onChange={e=>setAssign({...assign,toUserId:e.target.value})}>
          <option value="">Operador</option>
          {users.map((u:any)=><option key={u.id} value={u.id}>{u.email}</option>)}
        </select>
        <select className="px-3 py-2 border border-border rounded-md bg-background" value={assign.toTeamId} onChange={e=>setAssign({...assign,toTeamId:e.target.value})}>
          <option value="">Equipo</option>
          {teams.map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Motivo" value={assign.reason} onChange={e=>setAssign({...assign,reason:e.target.value})} />
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 md:col-span-4">Asignar</button>
      </form>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-left">CW ID</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Asignado</th><th className="p-3 text-left">Equipo</th><th className="p-3 text-left">Cliente</th></tr></thead>
          <tbody>
            {(data.references||[]).map((r:any)=>(
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">#{r.chatwootConversationId}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">{r.localAssignee?.email || '-'}</td>
                <td className="p-3">{r.localTeam?.name || '-'}</td>
                <td className="p-3">
                  <select className="text-xs border border-border rounded bg-background" value={r.clientId || ''} onChange={e=>linkClient(r.id, e.target.value)}>
                    <option value="">Sin cliente</option>
                    {clients.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
