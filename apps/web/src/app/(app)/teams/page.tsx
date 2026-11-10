'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  useEffect(() => { apiFetch('/api/v1/teams').then(setTeams).catch(()=>{}); }, []);
  return (
    <div className="space-y-3">
      {teams.map((t) => (
        <div key={t.id} className="bg-card border border-border rounded-xl p-4">
          <div className="font-semibold">{t.name}</div>
          <div className="text-sm text-muted-foreground">{t.description}</div>
          <div className="text-sm mt-2">Miembros: {t.members?.length ?? 0}</div>
        </div>
      ))}
      {teams.length === 0 && <div className="text-muted-foreground">Sin equipos</div>}
    </div>
  );
}
