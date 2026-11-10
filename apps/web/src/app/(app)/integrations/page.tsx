'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function load() { setIntegrations(await apiFetch('/api/v1/integrations')); }
  useEffect(() => { load().catch(()=>{}); }, []);

  async function test(key: string) {
    setTesting(key); setResult(null);
    try { setResult(await apiFetch(`/api/v1/integrations/${key}/test`, { method: 'POST' })); load(); }
    catch (e: any) { setResult({ ok: false, error: e.message }); }
    finally { setTesting(null); }
  }

  return (
    <div className="space-y-4">
      {integrations.map((i) => (
        <div key={i.id} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{i.name} <span className="text-xs text-muted-foreground">({i.key})</span></div>
              <div className="text-sm text-muted-foreground">Tipo: {i.type} · Activo: {i.isActive ? 'Sí' : 'No'}</div>
              {i.eventCounts?.length ? <div className="text-xs mt-2">Eventos: {i.eventCounts.map((e:any)=>`${e.status}:${e.count}`).join(', ')}</div> : null}
            </div>
            <button onClick={() => test(i.key)} disabled={testing===i.key} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
              {testing===i.key ? 'Probando...' : 'Probar conexión'}
            </button>
          </div>
          {result && testing===null && <pre className="mt-3 text-xs bg-muted p-2 rounded">{JSON.stringify(result,null,2)}</pre>}
        </div>
      ))}
      {integrations.length === 0 && <div className="text-muted-foreground">Sin integraciones</div>}
    </div>
  );
}
