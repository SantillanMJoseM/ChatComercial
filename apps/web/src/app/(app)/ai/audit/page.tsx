'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AuditPage() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  useEffect(() => { apiFetch(`/api/v1/ai/queries?page=${page}`).then(setData).catch(()=>{}); }, [page]);
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-700"><tr><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Asistente</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Tokens</th><th className="p-3 text-left">Latencia</th></tr></thead>
          <tbody>
            {(data.items||[]).map((q:any)=>(
              <tr key={q.id} className="border-t border-border">
                <td className="p-3 text-xs">{new Date(q.createdAt).toLocaleString()}</td>
                <td className="p-3">{q.assistant?.key}</td>
                <td className="p-3">{q.status}</td>
                <td className="p-3">{q.inputTokens}/{q.outputTokens}</td>
                <td className="p-3">{q.latencyMs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 border border-border rounded text-sm">Anterior</button>
        <button onClick={()=>setPage(p=>p+1)} className="px-3 py-1 border border-border rounded text-sm">Siguiente</button>
      </div>
    </div>
  );
}
