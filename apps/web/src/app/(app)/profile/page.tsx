'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ProfilePage() {
  const [me, setMe] = useState<any>(null);
  useEffect(() => { apiFetch('/api/v1/auth/me').then(setMe).catch(()=>{}); }, []);
  if (!me) return <div>Cargando...</div>;
  return (
    <div className="bg-card border border-border rounded-xl p-6 max-w-lg">
      <div className="mb-2"><span className="text-muted-foreground">Nombre:</span> {me.name}</div>
      <div className="mb-2"><span className="text-muted-foreground">Email:</span> {me.email}</div>
      <div className="mb-2"><span className="text-muted-foreground">Roles:</span> {me.roles?.join(', ')}</div>
      <div className="mb-2"><span className="text-muted-foreground">Permisos:</span> {me.permissions?.join(', ')}</div>
    </div>
  );
}
