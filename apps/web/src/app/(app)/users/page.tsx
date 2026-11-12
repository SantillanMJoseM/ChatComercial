'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { apiFetch('/api/v1/users').then(setUsers).catch((e)=>setError(e.message)); }, []);
  return (
    <div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr><th className="text-left p-3">Email</th><th className="text-left p-3">Nombre</th><th className="text-left p-3">Roles</th><th className="text-left p-3">Activo</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-200">
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.roles?.join(', ')}</td>
                <td className="p-3">{u.isActive ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
