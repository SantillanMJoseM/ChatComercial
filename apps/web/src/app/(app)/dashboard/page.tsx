'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [attention, setAttention] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [ai, setAi] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  useEffect(() => {
    apiFetch('/api/v1/reports/overview').then(setOverview).catch(()=>{});
    apiFetch('/api/v1/reports/attention').then(setAttention).catch(()=>{});
    apiFetch('/api/v1/system/status').then(setStatus).catch(()=>{});
    apiFetch('/api/v1/ai/usage').then(setAi).catch(()=>{});
    apiFetch('/api/v1/reports/trends').then(setTrends).catch(()=>{});
  }, []);
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard ejecutivo" description="Resumen operativo de la plataforma. Datos reales, sin valores ficticios." />
      <section>
        <h2 className="text-lg font-semibold mb-3">Indicadores comerciales</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard title="Clientes totales" value={overview?.clients?.total} />
          <KpiCard title="Clientes nuevos (30d)" value={overview?.clients?.new} color="text-green-600" />
          <KpiCard title="Operadores" value={overview?.operators?.total} />
          <KpiCard title="Automatizaciones" value={overview?.automations?.total} />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Atención y conversaciones</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard title="Conversaciones totales" value={attention?.total} />
          {(attention?.byStatus || []).map((s: any) => (
            <KpiCard key={s.status} title={`Conv. ${s.status}`} value={s.count} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Servicios</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard title="API" value={status?.status} color={status?.status === 'ok' ? 'text-green-600' : 'text-red-600'} />
          <KpiCard title="Base de datos" value={status?.checks?.database} />
          <KpiCard title="Redis" value={status?.checks?.redis} />
          <KpiCard title="Consultas IA" value={overview?.ai?.queries} />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Evolución de clientes</h2>
        <div className="bg-card border border-border rounded-xl p-4" style={{ height: 260 }}>
          {trends?.clientsByDay?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.clientsByDay}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="text-sm text-muted-foreground">Sin datos suficientes.</div>}
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
