'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  useEffect(() => { apiFetch('/api/v1/knowledge/collections').then(setCollections).catch(()=>{}); }, []);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted"><tr><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">ID</th><th className="p-3 text-left">Acción</th></tr></thead>
        <tbody>
          {collections.map((c:any)=>(
            <tr key={c.id} className="border-t border-border">
              <td className="p-3">{c.name}</td><td className="p-3 text-xs">{c.id}</td>
              <td className="p-3"><Link href={`/knowledge/collections/${c.id}`} className="text-primary text-xs hover:underline">Ver</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
