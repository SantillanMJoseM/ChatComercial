'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function WhatsAppGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [form, setForm] = useState({ session: 'default', name: '', segmentId: '', phones: '' });
  useEffect(() => { apiFetch('/api/v1/whatsapp-groups').then(setGroups).catch(()=>{}); apiFetch('/api/v1/segments').then(setSegments).catch(()=>{}); }, []);
  async function doPreview(e: React.FormEvent) {
    e.preventDefault();
    const phones = form.phones.split(',').map(s=>s.trim()).filter(Boolean);
    const r = await apiFetch('/api/v1/whatsapp-groups/preview', { method: 'POST', body: JSON.stringify({ session: form.session, segmentId: form.segmentId || undefined, phones }) });
    setPreview(r);
  }
  async function create(e: React.FormEvent) {
    e.preventDefault();
    const phones = form.phones.split(',').map(s=>s.trim()).filter(Boolean);
    await apiFetch('/api/v1/whatsapp-groups', { method: 'POST', body: JSON.stringify({ session: form.session, name: form.name, segmentId: form.segmentId || undefined, phones, idempotencyKey: form.name+'-'+Date.now() }) });
    apiFetch('/api/v1/whatsapp-groups').then(setGroups);
  }
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 text-sm">
        Sesión WAHA debe estar conectada (QR) para crear grupos. Estado verificable vía integraciones.
      </div>
      <form onSubmit={doPreview} className="bg-card border border-border rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Sesión" value={form.session} onChange={e=>setForm({...form,session:e.target.value})} />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Nombre grupo" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        <select className="px-3 py-2 border border-border rounded-md bg-background" value={form.segmentId} onChange={e=>setForm({...form,segmentId:e.target.value})}>
          <option value="">Segmento (opcional)</option>
          {segments.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className="px-3 py-2 border border-border rounded-md bg-background md:col-span-2" placeholder="Teléfonos (coma)" value={form.phones} onChange={e=>setForm({...form,phones:e.target.value})} />
        <div className="flex gap-2">
          <button type="submit" className="bg-muted px-4 py-2 rounded-md text-sm">Preview</button>
          <button type="button" onClick={create as any} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">Crear grupo</button>
        </div>
      </form>
      {preview && <div className="bg-card border border-border rounded-xl p-4 text-sm">Conectado: {String(preview.sessionConnected)} · Elegibles: {preview.eligible}/{preview.total} · Excluidos: {preview.excluded?.length}</div>}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">WAHA ID</th><th className="p-3 text-left">Miembros</th></tr></thead>
          <tbody>
            {groups.map((g:any)=>(
              <tr key={g.id} className="border-t border-border">
                <td className="p-3">{g.name}</td><td className="p-3 text-xs">{g.wahaGroupId}</td><td className="p-3">{g.members?.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
