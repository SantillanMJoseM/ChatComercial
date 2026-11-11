'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function KnowledgePage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [docForm, setDocForm] = useState({ collectionId: '', name: '', mimeType: 'text/plain', sizeBytes: 0, storagePath: '', hash: '' });
  useEffect(() => {
    apiFetch('/api/v1/knowledge/collections').then(setCollections).catch(()=>{});
    apiFetch('/api/v1/knowledge/documents').then(setDocuments).catch(()=>{});
  }, []);
  async function createCol(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/knowledge/collections', { method: 'POST', body: JSON.stringify(form) });
    setForm({ name: '', description: '' });
    apiFetch('/api/v1/knowledge/collections').then(setCollections);
  }
  async function createDoc(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/api/v1/knowledge/documents', { method: 'POST', body: JSON.stringify({ ...docForm, sizeBytes: Number(docForm.sizeBytes) }) });
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
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Tamaño (bytes)" value={docForm.sizeBytes} onChange={e=>setDocForm({...docForm,sizeBytes:e.target.value as any})} />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Storage path" value={docForm.storagePath} onChange={e=>setDocForm({...docForm,storagePath:e.target.value})} required />
        <input className="px-3 py-2 border border-border rounded-md bg-background" placeholder="Hash SHA-256" value={docForm.hash} onChange={e=>setDocForm({...docForm,hash:e.target.value})} required />
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
    </div>
  );
}
