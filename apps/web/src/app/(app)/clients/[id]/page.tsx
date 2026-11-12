'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function ClientDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [client, setClient] = useState<any>(null);
  const [note, setNote] = useState('');
  const [interaction, setInteraction] = useState({ type: 'note', summary: '' });

  async function load() { setClient(await apiFetch(`/api/v1/clients/${id}`)); }
  useEffect(() => { if (id) load(); }, [id]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/notes', { method: 'POST', body: JSON.stringify({ clientId: id, body: note }) });
    setNote(''); load();
  }
  async function addInteraction(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/interactions', { method: 'POST', body: JSON.stringify({ clientId: id, type: interaction.type, summary: interaction.summary }) });
    setInteraction({ type: 'note', summary: '' }); load();
  }

  if (!client) return <div>Cargando...</div>;
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold">{client.name}</h2>
        <div className="text-sm text-slate-400 mt-1">{client.legalName} · {client.taxId}</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 text-sm">
          <div>Teléfono: {client.phone || '-'}</div>
          <div>Email: {client.email || '-'}</div>
          <div>Dirección: {client.address || '-'}</div>
          <div>Origen: {client.origin || '-'}</div>
          <div>Estado: {client.status}</div>
          <div>Última interacción: {client.lastInteractionAt ? new Date(client.lastInteractionAt).toLocaleString() : '-'}</div>
        </div>
        {client.tags?.length ? <div className="mt-2 text-xs">Tags: {client.tags.join(', ')}</div> : null}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-2">Contactos</h3>
        <ul className="text-sm space-y-1">{(client.contacts||[]).map((c:any)=><li key={c.id}>{c.firstName} {c.lastName} {c.isPrimary?'(principal)':''} · {c.whatsapp||c.phone} · {c.email}</li>)}</ul>
        {(client.contacts||[]).length===0 && <div className="text-slate-400 text-sm">Sin contactos</div>}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-2">Conversaciones relacionadas</h3>
        <ul className="text-sm space-y-1">{(client.conversations||[]).map((c:any)=><li key={c.id}>#{c.chatwootConversationId} ({c.status})</li>)}</ul>
        {(client.conversations||[]).length===0 && <div className="text-slate-400 text-sm">Sin conversaciones</div>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-2">Notas internas</h3>
          <form onSubmit={addNote} className="flex gap-2 mb-3">
            <input className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm" value={note} onChange={e=>setNote(e.target.value)} placeholder="Nueva nota" />
            <button className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm">Agregar</button>
          </form>
          <ul className="text-sm space-y-2">{(client.clientNotes||[]).map((n:any)=><li key={n.id} className="border-b border-border pb-1"><div>{n.body}</div><div className="text-xs text-slate-400">{n.author?.email} · {new Date(n.createdAt).toLocaleString()}</div></li>)}</ul>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-2">Interacciones</h3>
          <form onSubmit={addInteraction} className="space-y-2 mb-3">
            <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={interaction.type} onChange={e=>setInteraction({...interaction,type:e.target.value})}>
              <option value="call">Llamada</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="meeting">Reunión</option><option value="note">Nota</option>
            </select>
            <input className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={interaction.summary} onChange={e=>setInteraction({...interaction,summary:e.target.value})} placeholder="Resumen" required />
            <button className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm">Registrar</button>
          </form>
          <ul className="text-sm space-y-2">{(client.interactions||[]).map((i:any)=><li key={i.id} className="border-b border-border pb-1"><div className="font-medium">{i.type}</div><div>{i.summary}</div><div className="text-xs text-slate-400">{i.actor?.email} · {new Date(i.occurredAt).toLocaleString()}</div></li>)}</ul>
        </div>
      </div>
    </div>
  );
}
