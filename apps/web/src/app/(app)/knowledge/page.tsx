'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function KnowledgePage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [docForm, setDocForm] = useState({ collectionId: '', name: '', mimeType: 'text/plain', description: '' });
  useEffect(() => {
    apiFetch('/api/v1/knowledge/collections').then(setCollections).catch(()=>{});
    apiFetch('/api/v1/knowledge/documents').then(setDocuments).catch(()=>{});
    apiFetch('/api/v1/knowledge/jobs').then(setJobs).catch(()=>{});
  }, []);
  async function createCol(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/knowledge/collections', { method: 'POST', body: JSON.stringify(form) });
    setForm({ name: '', description: '' });
    apiFetch('/api/v1/knowledge/collections').then(setCollections);
  }
  async function createDoc(e: React.FormEvent) {
    e.preventDefault();
    const input = document.getElementById('fileInput') as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) { alert('Selecciona un archivo'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('collectionId', docForm.collectionId);
    fd.append('description', docForm.description || '');
    const res = await fetch('/api/v1/knowledge/documents/upload', { method: 'POST', credentials: 'include', body: fd });
    if (!res.ok) { alert('Error al subir'); return; }
    input.value = '';
    apiFetch('/api/v1/knowledge/documents').then(setDocuments);
  }
  return (
    <div className="space-y-4">
      <form onSubmit={createCol} className="bg-card border border-border rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Colección" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Descripción" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2">Crear colección</button>
      </form>
      <form onSubmit={createDoc} className="bg-card border border-border rounded-xl p-4 grid gap-2 md:grid-cols-3">
        <select className="px-3 py-2 border border-border rounded-md bg-background" value={docForm.collectionId} onChange={e=>setDocForm({...docForm,collectionId:e.target.value})} required>
          <option value="">Colección</option>
          {collections.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Nombre doc" value={docForm.name} onChange={e=>setDocForm({...docForm,name:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="MIME" value={docForm.mimeType} onChange={e=>setDocForm({...docForm,mimeType:e.target.value})} />
        <input id="fileInput" type="file" className="px-3 py-2 border border-border rounded-md bg-background" required />
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 md:col-span-3">Registrar documento</button>
      </form>
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Colecciones</h3>
        <ul className="text-sm">{collections.map((c:any)=><li key={c.id}>{c.name} ({c.id})</li>)}</ul>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Documentos</h3>
        <ul className="text-sm">{documents.map((d:any)=><li key={d.id}>{d.name} - {d.status}</li>)}</ul>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Procesamiento</h3>
        <ul className="text-sm">{jobs.map((j:any)=><li key={j.id}>{j.status} - {j.step} - chunks? {j.versionId}</li>)}</ul>
      </div>
    </div>
  );
}
