'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const [status, setStatus] = useState<any>(null);
  useEffect(() => { apiFetch('/api/v1/system/status').then(setStatus).catch(()=>{}); }, []);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="text-sm text-muted-foreground">Estado API</div>
        <div className="text-2xl font-bold mt-2">{status?.status ?? '...'}</div>
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="text-sm text-muted-foreground">Base de datos</div>
        <div className="text-2xl font-bold mt-2">{status?.checks?.database ?? '...'}</div>
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="text-sm text-muted-foreground">Redis</div>
        <div className="text-2xl font-bold mt-2">{status?.checks?.redis ?? '...'}</div>
      </div>
    </div>
  );
}
