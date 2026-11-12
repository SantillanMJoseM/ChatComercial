'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function SkillToolsPage() {
  const params = useParams();
  const key = params?.key as string;
  const [tools, setTools] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [versionId, setVersionId] = useState('');
  const [allowed, setAllowed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!key) return;
    apiFetch('/api/v1/ai/tools').then(setTools).catch(()=>{});
    apiFetch(`/api/v1/skills/${key}/versions`).then((v:any[]) => { setVersions(v); if (v.length) setVersionId(v[0].id); }).catch(()=>{});
  }, [key]);

  async function toggle(toolId: string, val: boolean) {
    if (!versionId) return;
    await apiFetch(`/api/v1/skills/${key}/set-tool-permission`, { method: 'POST', body: JSON.stringify({ skillVersionId: versionId, toolId, allowed: val }) });
    setAllowed({ ...allowed, [toolId]: val });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="text-sm">Versión</label>
        <select className="ml-2 px-3 py-2 border border-border rounded-md bg-background text-sm" value={versionId} onChange={e=>setVersionId(e.target.value)}>
          {versions.map((v:any)=><option key={v.id} value={v.id}>v{v.version} ({v.status})</option>)}
        </select>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-700"><tr><th className="p-3 text-left">Herramienta</th><th className="p-3 text-left">Descripción</th><th className="p-3 text-left">Permitida</th></tr></thead>
          <tbody>
            {tools.map((t:any)=>(
              <tr key={t.id} className="border-t border-border">
                <td className="p-3">{t.name}</td><td className="p-3 text-xs">{t.description}</td>
                <td className="p-3"><input type="checkbox" checked={allowed[t.id]||false} onChange={e=>toggle(t.id, e.target.checked)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
