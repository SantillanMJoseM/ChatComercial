'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

export default function ReportsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [attention, setAttention] = useState<any>(null);
  const [ai, setAi] = useState<any>(null);
  const [automations, setAutomations] = useState<any>(null);
  useEffect(() => {
    apiFetch('/api/v1/reports/overview').then(setOverview).catch(()=>{});
    apiFetch('/api/v1/reports/attention').then(setAttention).catch(()=>{});
    apiFetch('/api/v1/reports/ai').then(setAi).catch(()=>{});
    apiFetch('/api/v1/reports/automations').then(setAutomations).catch(()=>{});
  }, []);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card border border-border rounded-xl p-4"><div className="text-xs text-muted-foreground">Clientes</div><div className="text-2xl font-bold">{overview?.clients?.total}</div></div>
        <div className="bg-card border border-border rounded-xl p-4"><div className="text-xs text-muted-foreground">Clientes nuevos</div><div className="text-2xl font-bold">{overview?.clients?.new}</div></div>
        <div className="bg-card border border-border rounded-xl p-4"><div className="text-xs text-muted-foreground">Conversaciones</div><div className="text-2xl font-bold">{overview?.conversations?.total}</div></div>
        <div className="bg-card border border-border rounded-xl p-4"><div className="text-xs text-muted-foreground">Consultas IA</div><div className="text-2xl font-bold">{overview?.ai?.queries}</div></div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Atención por estado</h3>
        <pre className="text-xs">{JSON.stringify(attention?.byStatus, null, 2)}</pre>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">IA</h3>
        <pre className="text-xs">{JSON.stringify(ai, null, 2)}</pre>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Automatizaciones</h3>
        <pre className="text-xs">{JSON.stringify(automations, null, 2)}</pre>
      </div>
    </div>
  );
}
