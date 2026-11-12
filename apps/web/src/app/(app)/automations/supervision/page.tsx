'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function SupervisionPage() {
  const [data, setData] = useState<any>({ automations: [], executions: [] });
  useEffect(() => { apiFetch('/api/v1/automations/pending-approvals').then(setData).catch(()=>{}); }, []);
  async function approve(id: string) { await apiFetch(`/api/v1/automations/${id}/approve`, { method: 'POST' }); apiFetch('/api/v1/automations/pending-approvals').then(setData); }
  async function reject(id: string) {
    const reason = prompt('Motivo de rechazo?');
    if (!reason) return;
    await apiFetch(`/api/v1/automations/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    apiFetch('/api/v1/automations/pending-approvals').then(setData);
  }
  async function submit(id: string) {
    await apiFetch(`/api/v1/automations/${id}/submit-approval`, { method: 'POST' });
    apiFetch('/api/v1/automations/pending-approvals').then(setData);
  }
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Automatizaciones pendientes de aprobación</h3>
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Acción</th></tr></thead>
          <tbody>
            {(data.automations||[]).map((a:any)=>(
              <tr key={a.id} className="border-t border-border">
                <td className="p-3">{a.name}</td><td className="p-3">{a.status}</td>
                <td className="p-3 flex gap-2">
                  {a.status==='draft' && <button onClick={()=>submit(a.id)} className="text-blue-600 text-xs">Enviar a aprobación</button>}
                  {a.status==='pending_approval' && (
                    <>
                      <button onClick={()=>approve(a.id)} className="text-green-600 text-xs">Aprobar</button>
                      <button onClick={()=>reject(a.id)} className="text-red-600 text-xs">Rechazar</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Ejecuciones pendientes de autorización</h3>
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-left">ID</th><th className="p-3 text-left">Estado</th></tr></thead>
          <tbody>
            {(data.executions||[]).map((e:any)=>(
              <tr key={e.id} className="border-t border-border">
                <td className="p-3 text-xs">{e.id}</td><td className="p-3">{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
