'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  useEffect(() => { apiFetch('/api/v1/system/settings').then(setSettings).catch(()=>{}); }, []);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <pre className="text-xs overflow-auto">{JSON.stringify(settings, null, 2)}</pre>
    </div>
  );
}
