'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function CollectionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [docs, setDocs] = useState<any[]>([]);
  useEffect(() => { if (id) apiFetch(`/api/v1/knowledge/documents?collectionId=${id}`).then(setDocs).catch(()=>{}); }, [id]);
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Documentos de la colección</h3>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-700"><tr><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Hash</th></tr></thead>
          <tbody>
            {docs.map((d:any)=>(
              <tr key={d.id} className="border-t border-border">
                <td className="p-3">{d.name}</td><td className="p-3">{d.status}</td><td className="p-3 text-xs">{d.hash?.slice(0,12)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
