'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
export default function MetricsPage() {
  const [m, setM] = useState<any>(null);
  useEffect(() => { apiFetch('/api/v1/metrics').then(setM).catch(()=>{}); }, []);
  if (!m) return <div>Cargando...</div>;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6"><div className="text-sm text-slate-500">Clientes totales</div><div className="text-2xl font-bold mt-2">{m.clients?.total}</div></div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6"><div className="text-sm text-slate-500">Clientes nuevos (30d)</div><div className="text-2xl font-bold mt-2">{m.clients?.newLast30Days}</div></div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6"><div className="text-sm text-slate-500">Operadores</div><div className="text-2xl font-bold mt-2">{m.operators?.total}</div></div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 md:col-span-3">
        <div className="text-sm text-slate-500 mb-2">Conversaciones por estado</div>
        <pre className="text-xs">{JSON.stringify(m.conversations?.byStatus, null, 2)}</pre>
        <div className="text-xs text-slate-500 mt-2">Fuente: {m.source?.conversations}</div>
      </div>
    </div>
  );
}
