'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { apiFetch('/api/v1/notifications').then(setItems).catch(()=>{}); }, []);
  async function markRead(id: string) {
    await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'POST' });
    apiFetch('/api/v1/notifications').then(setItems);
  }
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted"><tr><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Título</th><th className="p-3 text-left">Leído</th><th className="p-3 text-left">Acción</th></tr></thead>
        <tbody>
          {items.map((n:any)=>(
            <tr key={n.id} className="border-t border-border">
              <td className="p-3 text-xs">{new Date(n.createdAt).toLocaleString()}</td>
              <td className="p-3">{n.title}</td>
              <td className="p-3">{n.read?'Sí':'No'}</td>
              <td className="p-3">{!n.read && <button onClick={()=>markRead(n.id)} className="text-primary text-xs">Marcar leído</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
