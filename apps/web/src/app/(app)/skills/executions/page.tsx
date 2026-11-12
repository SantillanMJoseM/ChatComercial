'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function SkillExecutionsPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { apiFetch('/api/v1/skill-executions').then(setItems).catch(()=>{}); }, []);
  async function approve(id: string) {
    await apiFetch(`/api/v1/skill-executions/${id}/approve`, { method: 'POST' });
    apiFetch('/api/v1/skill-executions').then(setItems);
  }
  async function reject(id: string) {
    await apiFetch(`/api/v1/skill-executions/${id}/reject`, { method: 'POST' });
    apiFetch('/api/v1/skill-executions').then(setItems);
  }
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-700"><tr><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Skill</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Duración</th><th className="p-3 text-left">Acción</th></tr></thead>
        <tbody>
          {items.map((e:any)=>(
            <tr key={e.id} className="border-t border-border">
              <td className="p-3 text-xs">{new Date(e.createdAt).toLocaleString()}</td>
              <td className="p-3">{e.skillVersion?.skill?.key}</td>
              <td className="p-3">{e.status}</td>
              <td className="p-3">{e.durationMs}ms</td>
              <td className="p-3">
                {e.status==='awaiting_approval' && (
                  <div className="flex gap-2">
                    <button onClick={()=>approve(e.id)} className="text-green-600 text-xs">Aprobar</button>
                    <button onClick={()=>reject(e.id)} className="text-red-600 text-xs">Rechazar</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
