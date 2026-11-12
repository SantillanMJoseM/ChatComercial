'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function FeedbackPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { apiFetch('/api/v1/ai/feedback').then(setItems).catch(()=>{}); }, []);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-700"><tr><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Rating</th><th className="p-3 text-left">Comentario</th></tr></thead>
        <tbody>
          {items.map((f:any)=>(
            <tr key={f.id} className="border-t border-border">
              <td className="p-3 text-xs">{new Date(f.createdAt).toLocaleString()}</td>
              <td className="p-3">{f.rating}</td>
              <td className="p-3">{f.comment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
