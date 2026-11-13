'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function SkillAssistantsPage() {
  const params = useParams();
  const key = params?.key as string;
  const [assistants, setAssistants] = useState<any[]>([]);
  const [skill, setSkill] = useState<any>(null);
  const [selected, setSelected] = useState('');
  useEffect(() => {
    apiFetch('/api/v1/ai/assistants').then(setAssistants).catch(()=>{});
    if (key) apiFetch(`/api/v1/skills/${key}`).then(setSkill).catch(()=>{});
  }, [key]);
  async function link() {
    if (!selected) return;
    await apiFetch(`/api/v1/skills/${key}/link-assistant`, { method: 'POST', body: JSON.stringify({ assistantId: selected }) });
    apiFetch(`/api/v1/skills/${key}`).then(setSkill);
  }
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 flex gap-2">
        <select aria-label="selector" className="px-3 py-2 border border-border rounded-md bg-background text-sm" value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">Asistente</option>
          {assistants.map((a:any)=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button onClick={link} className="bg-primary text-indigo-400-foreground rounded-md px-4 py-2 text-sm">Vincular</button>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Asistentes vinculados</h3>
        <ul className="text-sm">{(skill?.assistants||[]).map((a:any)=><li key={a.id}>{a.assistant?.name} ({a.assistant?.key})</li>)}</ul>
      </div>
    </div>
  );
}
