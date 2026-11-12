'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

function Kpi({ title, value, color }: { title: string; value: any; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{title}</div>
      <div className={`text-3xl font-bold mt-2 ${color || 'text-foreground'}`}>{value ?? '—'}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [attention, setAttention] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [ai, setAi] = useState<any>(null);
  useEffect(() => {
    apiFetch('/api/v1/reports/overview').then(setOverview).catch(()=>{});
    apiFetch('/api/v1/reports/attention').then(setAttention).catch(()=>{});
    apiFetch('/api/v1/system/status').then(setStatus).catch(()=>{});
    apiFetch('/api/v1/ai/usage').then(setAi).catch(()=>{});
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard ejecutivo</h1>
        <p className="text-sm text-muted-foreground">Resumen operativo de la plataforma. Datos reales, sin valores ficticios.</p>
      </div>
      <section>
        <h2 className="text-lg font-semibold mb-3">Indicadores comerciales</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi title="Clientes totales" value={overview?.clients?.total} />
          <Kpi title="Clientes nuevos (30d)" value={overview?.clients?.new} color="text-green-600" />
          <Kpi title="Operadores" value={overview?.operators?.total} />
          <Kpi title="Automatizaciones" value={overview?.automations?.total} />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Atención y conversaciones</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi title="Conversaciones totales" value={attention?.total} />
          {(attention?.byStatus || []).map((s: any) => (
            <Kpi key={s.status} title={`Conv. ${s.status}`} value={s.count} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Servicios</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi title="API" value={status?.status} color={status?.status === 'ok' ? 'text-green-600' : 'text-red-600'} />
          <Kpi title="Base de datos" value={status?.checks?.database} />
          <Kpi title="Redis" value={status?.checks?.redis} />
          <Kpi title="Consultas IA" value={overview?.ai?.queries} />
        </div>
      </section>
      {ai && Array.isArray(ai) && ai.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Consumo IA</h2>
          <div className="bg-card border border-border rounded-xl p-4">
            <pre className="text-xs overflow-auto">{JSON.stringify(ai, null, 2)}</pre>
          </div>
        </section>
      )}
    </div>
  );
}
