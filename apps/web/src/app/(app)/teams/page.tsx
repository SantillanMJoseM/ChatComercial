'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [sup, setSup] = useState({ teamId: '', userId: '' });

  async function load() { setTeams(await apiFetch('/api/v1/teams')); }
  useEffect(() => { load().catch(()=>{}); apiFetch('/api/v1/users').then(setUsers).catch(()=>{}); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/teams', { method: 'POST', body: JSON.stringify(form) });
    setForm({ name: '', description: '' }); load();
  }
  async function addSup(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch(`/api/v1/teams/${sup.teamId}/supervisors`, { method: 'POST', body: JSON.stringify({ userId: sup.userId }) });
    setSup({ teamId: '', userId: '' }); load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-card border border-border rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Nombre equipo" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Descripción" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2">Crear equipo</button>
      </form>
      <form onSubmit={addSup} className="bg-card border border-border rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <select className="px-3 py-2 border border-border rounded-md bg-background" value={sup.teamId} onChange={e=>setSup({...sup,teamId:e.target.value})} required>
          <option value="">Equipo</option>
          {teams.map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="px-3 py-2 border border-border rounded-md bg-background" value={sup.userId} onChange={e=>setSup({...sup,userId:e.target.value})} required>
          <option value="">Supervisor</option>
          {users.map((u:any)=><option key={u.id} value={u.id}>{u.email}</option>)}
        </select>
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2">Asignar supervisor</button>
      </form>
      <div className="space-y-3">
        {teams.map((t:any)=>(
          <div key={t.id} className="bg-card border border-border rounded-xl p-4">
            <div className="font-semibold">{t.name}</div>
            <div className="text-sm text-muted-foreground">{t.description}</div>
            <div className="text-sm mt-2">Miembros: {t.members?.length ?? 0}</div>
            <div className="text-sm">Supervisores: {(t.supervisors||[]).map((s:any)=>s.user?.email).join(', ') || '-'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
