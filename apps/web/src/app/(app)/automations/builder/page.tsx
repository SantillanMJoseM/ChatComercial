'use client';
import { useCallback, useState } from 'react';
import { ReactFlow, Controls, Background, addEdge, useNodesState, useEdgesState } from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { apiFetch } from '@/lib/api';

const nodeTypes = {};

export default function AutomationBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([
    { id: 'trigger-1', position: { x: 100, y: 100 }, data: { label: 'Disparador: client.created' }, type: 'input' },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [name, setName] = useState('Nueva automatización');
  const [saving, setSaving] = useState(false);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const addNode = (type: string, label: string) => {
    const id = `${type}-${Date.now()}`;
    setNodes((nds) => [...nds, { id, position: { x: 200, y: 200 + nds.length * 80 }, data: { label }, type: type === 'trigger' ? 'input' : type === 'action' ? 'default' : 'default' }]);
  };

  async function save() {
    setSaving(true);
    try {
      const auto = await apiFetch('/api/v1/automations', { method: 'POST', body: JSON.stringify({ name, description: 'Creada desde builder', category: 'visual' }) });
      const flow = { nodes, edges };
      await apiFetch(`/api/v1/automations/${auto.id}/versions`, { method: 'POST', body: JSON.stringify({ version: 1, trigger: { type: 'manual' }, conditions: {}, actions: [flow] }) });
      alert('Guardado: ' + auto.id);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input className="px-3 py-2 border border-border rounded-md bg-background text-sm" value={name} onChange={e=>setName(e.target.value)} />
        <button onClick={save} disabled={saving} className="bg-primary text-indigo-400-foreground rounded-md px-4 py-2 text-sm disabled:opacity-50">{saving?'Guardando...':'Guardar'}</button>
        <button onClick={()=>addNode('condition','Condición')} className="px-3 py-2 border border-border rounded-md text-sm">+ Condición</button>
        <button onClick={()=>addNode('action','Acción: send_notification')} className="px-3 py-2 border border-border rounded-md text-sm">+ Acción</button>
      </div>
      <div style={{ height: 500 }} className="bg-card border border-border rounded-xl">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
