'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

export default function SegmentsPage() {
  const [segments, setSegments] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', criteria: { combine: 'and', filters: [] } });
  const [preview, setPreview] = useState<any>(null);
  useEffect(() => { apiFetch('/api/v1/segments').then(setSegments).catch(()=>{}); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/segments', { method: 'POST', body: JSON.stringify(form) });
    setForm({ name: '', description: '', criteria: { combine: 'and', filters: [] } });
    apiFetch('/api/v1/segments').then(setSegments);
  }
  async function previewSeg(id: string) {
    const r = await apiFetch(`/api/v1/segments/${id}/preview`, { method: 'POST' });
    setPreview(r);
  }
  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-slate-800 border border-slate-700 rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <input className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" placeholder="Nombre segmento" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input className="px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" placeholder="Descripción" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <button className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-md px-4 py-2">Crear segmento</button>
      </form>
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50"><tr><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Dinámico</th><th className="p-3 text-left">Acciones</th></tr></thead>
          <tbody>
            {segments.map((s:any)=>(
              <tr key={s.id} className="border-t border-slate-700">
                <td className="p-3">{s.name}</td><td className="p-3">{s.isDynamic?'Sí':'No'}</td>
                <td className="p-3"><button onClick={()=>previewSeg(s.id)} className="text-primary text-xs hover:underline">Preview</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {preview && <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm">Participantes: {preview.count}</div>}
    </div>
  );
}
