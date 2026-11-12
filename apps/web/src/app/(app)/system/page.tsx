'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

export default function SystemPage() {
  const [status, setStatus] = useState<any>(null);
  useEffect(() => { apiFetch('/api/v1/system/status').then(setStatus).catch(()=>{}); }, []);
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <pre className="text-xs overflow-auto">{JSON.stringify(status, null, 2)}</pre>
    </div>
  );
}
