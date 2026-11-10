'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function SystemPage() {
  const [status, setStatus] = useState<any>(null);
  useEffect(() => { apiFetch('/api/v1/system/status').then(setStatus).catch(()=>{}); }, []);
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <pre className="text-xs overflow-auto">{JSON.stringify(status, null, 2)}</pre>
    </div>
  );
}
