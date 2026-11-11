'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function SkillPermissionsPage() {
  const params = useParams();
  const key = params?.key as string;
  const [skill, setSkill] = useState<any>(null);
  const [perms, setPerms] = useState('');
  useEffect(() => { if (key) apiFetch(`/api/v1/skills/${key}`).then((s:any) => { setSkill(s); }).catch(()=>{}); }, [key]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    // permissions are set on version creation; here we just display
    alert('Permisos se definen al crear la versión (requiredPermissions).');
  }
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-2">Permisos requeridos</h3>
        <p className="text-sm text-muted-foreground">Los permisos se configuran en la creación de versión (campo requiredPermissions). Skill: {skill?.key}</p>
      </div>
    </div>
  );
}
