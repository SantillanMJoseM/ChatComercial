'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  useEffect(() => { apiFetch('/api/v1/knowledge/jobs').then(setJobs).catch(()=>{}); }, []);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-700"><tr><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Step</th><th className="p-3 text-left">Versión</th><th className="p-3 text-left">Error</th></tr></thead>
        <tbody>
          {jobs.map((j:any)=>(
            <tr key={j.id} className="border-t border-border">
              <td className="p-3">{j.status}</td><td className="p-3">{j.step}</td><td className="p-3 text-xs">{j.versionId}</td><td className="p-3 text-xs text-red-600">{j.error}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
