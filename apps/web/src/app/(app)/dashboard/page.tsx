'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [attention, setAttention] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [ai, setAi] = useState<any>(null);
  useEffect(() => {
    apiFetch('/api/v1/reports/overview').then(setOverview).catch(()=>{});
    apiFetch('/api/v1/reports/attention').then(setAttention).catch(()=>{});
    apiFetch('/api/v1/system/status').then(setStatus).catch(()=>{});
    apiFetch('/api/v1/reports/trends').then(setTrends).catch(()=>{});
    apiFetch('/api/v1/ai/usage').then(setAi).catch(()=>{});
  }, []);

  const Kpi = ({ title, value, color, icon }: { title: string; value: any; color?: string; icon?: string }) => (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition-colors">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 uppercase tracking-wide">{title}</div>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={`text-3xl font-bold mt-2 ${color || 'text-white'}`}>{value ?? '—'}</div>
    </div>
  );

  return (
    <div className="space-y-6 -m-6 p-6 bg-[#0F172A] min-h-screen text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard ejecutivo</h1>
          <p className="text-sm text-slate-500">Resumen operativo de la plataforma. Datos reales.</p>
        </div>
        <div className="text-xs text-slate-500">Actualizado: {new Date().toLocaleString()}</div>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Indicadores comerciales</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi title="Clientes totales" value={overview?.clients?.total} icon="👥" color="text-indigo-400" />
          <Kpi title="Clientes nuevos (30d)" value={overview?.clients?.new} icon="📈" color="text-green-400" />
          <Kpi title="Operadores" value={overview?.operators?.total} icon="🎧" color="text-blue-400" />
          <Kpi title="Automatizaciones" value={overview?.automations?.total} icon="⚙️" color="text-violet-400" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Atención y conversaciones</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi title="Conversaciones totales" value={attention?.total} icon="💬" color="text-cyan-400" />
          {(attention?.byStatus || []).map((s: any) => (
            <Kpi key={s.status} title={`Conv. ${s.status}`} value={s.count} icon="📌" />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Evolución de clientes</h3>
          <div style={{ height: 220 }}>
            {trends?.clientsByDay?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.clientsByDay}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} />
                  <Line type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="text-sm text-slate-500">Sin datos suficientes.</div>}
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Servicios</h3>
          <div className="space-y-3">
            {[
              { name: 'API', value: status?.status },
              { name: 'Base de datos', value: status?.checks?.database },
              { name: 'Redis', value: status?.checks?.redis },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{s.name}</span>
                <span className={`text-sm font-semibold ${s.value === 'ok' || s.value === 'ready' ? 'text-green-400' : 'text-red-400'}`}>{s.value ?? '—'}</span>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Consultas IA</span>
              <span className="text-sm font-semibold text-indigo-400">{overview?.ai?.queries ?? '—'}</span>
            </div>
          </div>
        </div>
      </section>

      {ai && Array.isArray(ai) && ai.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Consumo IA</h2>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <pre className="text-xs text-slate-300 overflow-auto">{JSON.stringify(ai, null, 2)}</pre>
          </div>
        </section>
      )}
    </div>
  );
}
