'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ChatwootTeamsPage() {
  const [teams, setTeams] = useState<any>({ chatwoot: [], links: [] });
  const [form, setForm] = useState({ name: '', description: '' });
  useEffect(() => { apiFetch('/api/v1/chatwoot-teams').then(setTeams).catch(()=>{}); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/chatwoot-teams', { method: 'POST', body: JSON.stringify(form) });
    apiFetch('/api/v1/chatwoot-teams').then(setTeams);
    setForm({ name: '', description: '' });
  }
  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-card border border-border rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Nombre equipo" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Descripción" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2">Crear en Chatwoot</button>
      </form>
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Equipos Chatwoot</h3>
        <pre className="text-xs overflow-auto">{JSON.stringify(teams.chatwoot, null, 2)}</pre>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Vínculos locales</h3>
        <pre className="text-xs overflow-auto">{JSON.stringify(teams.links, null, 2)}</pre>
      </div>
    </div>
  );
}
