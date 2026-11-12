'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
export default function AssignmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { apiFetch('/api/v1/assignments').then(setItems).catch(()=>{}); }, []);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50"><tr><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">De</th><th className="p-3 text-left">A</th><th className="p-3 text-left">Motivo</th><th className="p-3 text-left">Sync</th></tr></thead>
        <tbody>
          {items.map((a:any)=>(
            <tr key={a.id} className="border-t border-slate-200">
              <td className="p-3">{new Date(a.createdAt).toLocaleString()}</td>
              <td className="p-3">{a.fromUser?.email || a.fromTeam?.name || '-'}</td>
              <td className="p-3">{a.toUser?.email || a.toTeam?.name || '-'}</td>
              <td className="p-3">{a.reason || '-'}</td>
              <td className="p-3">{a.syncStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
