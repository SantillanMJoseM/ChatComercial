'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [qr, setQr] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  async function load() { setIntegrations(await apiFetch('/api/v1/integrations')); }
  async function loadWaha() { try { setSession(await apiFetch('/api/v1/integrations/waha/session?session=default')); } catch {} }
  useEffect(() => { load().catch(()=>{}); loadWaha(); }, []);

  async function test(key: string) {
    setTesting(key); setResult(null);
    try { setResult(await apiFetch(`/api/v1/integrations/${key}/test`, { method: 'POST' })); load(); }
    catch (e: any) { setResult({ ok: false, error: e.message }); }
    finally { setTesting(null); }
  }

  return (
    <div className="space-y-4">
      {integrations.map((i) => (
        <div key={i.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{i.name} <span className="text-xs text-slate-500">({i.key})</span></div>
              <div className="text-sm text-slate-500">Tipo: {i.type} · Activo: {i.isActive ? 'Sí' : 'No'}</div>
              {i.eventCounts?.length ? <div className="text-xs mt-2">Eventos: {i.eventCounts.map((e:any)=>`${e.status}:${e.count}`).join(', ')}</div> : null}
            </div>
            <div className="flex gap-2">
              {i.key==='waha' && <button onClick={async()=>{ try { setQr(await apiFetch('/api/v1/integrations/waha/qr?session=default')); } catch(e:any){ setQr({error:e.message}); } }} className="px-3 py-2 border border-slate-700 rounded-md text-sm">Ver QR</button>}
              <button onClick={() => test(i.key)} disabled={testing===i.key} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md text-sm disabled:opacity-50">
                {testing===i.key ? 'Probando...' : 'Probar conexión'}
              </button>
            </div>
          </div>
          {result && testing===null && <pre className="mt-3 text-xs bg-slate-700/50 p-2 rounded">{JSON.stringify(result,null,2)}</pre>}
        </div>
      ))}
      {session && <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm">WAHA sesión: {session.status} · {session.me?.id || 'sin vincular'}</div>}
      {qr && qr.base64 && <div className="bg-slate-800 border border-slate-700 rounded-xl p-4"><img src={`data:${qr.mime};base64,${qr.base64}`} alt="QR" className="w-48 h-48" /></div>}
      {qr && qr.error && <div className="text-red-600 text-sm">{qr.error}</div>}
      {integrations.length === 0 && <div className="text-slate-500">Sin integraciones</div>}
    </div>
  );
}
