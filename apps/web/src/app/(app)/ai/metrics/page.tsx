'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AIMetricsPage() {
  const [usage, setUsage] = useState<any[]>([]);
  useEffect(() => { apiFetch('/api/v1/ai/usage').then(setUsage).catch(()=>{}); }, []);
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-2">Consumo por proveedor</h3>
        <pre className="text-xs overflow-auto">{JSON.stringify(usage, null, 2)}</pre>
      </div>
    </div>
  );
}
