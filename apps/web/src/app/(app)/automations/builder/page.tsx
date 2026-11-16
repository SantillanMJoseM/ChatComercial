'use client';
import { useCallback, useState } from 'react';
import ReactFlow, { Controls, Background, addEdge, useNodesState, useEdgesState, Handle, Position } from '@xyflow/react';
import type { Node, Edge, Connection, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

const CATEGORY_COLORS: Record<string, string> = {
  trigger: 'bg-indigo-600',
  condition: 'bg-amber-600',
  action: 'bg-emerald-600',
  control: 'bg-slate-600',
};

function CustomNode({ data }: NodeProps) {
  const type = (data?.type as string) || 'action';
  const color = CATEGORY_COLORS[type] || 'bg-slate-600';
  return (
    <div className={`rounded-lg border border-slate-600 bg-slate-800 shadow-md min-w-[160px]`}>
      <div className={`${color} text-white text-xs font-semibold px-3 py-1.5 rounded-t-lg flex items-center gap-2`}>
        <span>{type === 'trigger' ? '⚡' : type === 'condition' ? '🔀' : type === 'control' ? '⏹' : '▶'}</span>
        <span className="truncate">{String(data?.label || '')}</span>
      </div>
      <div className="px-3 py-2 text-xs text-slate-400">{type}</div>
      <Handle type="target" position={Position.Left} className="!bg-indigo-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-400 !w-3 !h-3" />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

const PALETTE = [
  { group: 'Disparadores', items: [
    { type: 'trigger', label: 'Evento client.created', nodeType: 'custom' },
    { type: 'trigger', label: 'Evento conversation.created', nodeType: 'custom' },
    { type: 'trigger', label: 'Evento manual', nodeType: 'custom' },
  ]},
  { group: 'Condiciones', items: [
    { type: 'condition', label: 'Si / Entonces', nodeType: 'custom' },
    { type: 'condition', label: 'Comparar texto', nodeType: 'custom' },
  ]},
  { group: 'Acciones', items: [
    { type: 'action', label: 'Enviar notificación', nodeType: 'custom' },
    { type: 'action', label: 'Crear nota', nodeType: 'custom' },
    { type: 'action', label: 'Agregar etiqueta', nodeType: 'custom' },
    { type: 'action', label: 'Ejecutar skill', nodeType: 'custom' },
    { type: 'action', label: 'Consultar RAG', nodeType: 'custom' },
    { type: 'action', label: 'Derivar a operador', nodeType: 'custom' },
  ]},
  { group: 'Control', items: [
    { type: 'control', label: 'Finalizar flujo', nodeType: 'custom' },
    { type: 'control', label: 'Manejar error', nodeType: 'custom' },
  ]},
];

export default function AutomationBuilderPage() {
  const Flow = ReactFlow as any;
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([
    { id: 'trigger-1', position: { x: 80, y: 120 }, data: { label: 'Disparador', type: 'trigger' }, type: 'custom' },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [name, setName] = useState('Nueva automatización');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Node | null>(null);
  const [filter, setFilter] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const addNode = (type: string, label: string, nodeType: string) => {
    const id = `${type}-${Date.now()}`;
    setNodes((nds) => [...nds, { id, position: { x: 260, y: 120 + nds.length * 90 }, data: { label, type }, type: nodeType }]);
  };

  function validate(): string[] {
    const errors: string[] = [];
    if (!nodes.some((n) => n.data?.type === 'trigger')) errors.push('Falta un nodo disparador.');
    if (nodes.length < 2) errors.push('El flujo debe tener al menos un nodo.');
    const connected = new Set(edges.flatMap((e) => [e.source, e.target]));
    for (const n of nodes) {
      if (n.data?.type !== 'trigger' && !connected.has(n.id)) errors.push(`Nodo "${n.data?.label}" está desconectado.`);
    }
    return errors;
  }

  async function save() {
    const errs = validate();
    setValidationErrors(errs);
    if (errs.length > 0) { alert('Corregí los errores antes de guardar.'); return; }
    setSaving(true);
    try {
      const auto = await apiFetch('/api/v1/automations', { method: 'POST', body: JSON.stringify({ name, description: 'Creada desde builder', category: 'visual' }) });
      const flow = { nodes, edges };
      const ver = await apiFetch(`/api/v1/automations/${auto.id}/versions`, { method: 'POST', body: JSON.stringify({ version: 1, trigger: { type: 'manual' }, conditions: {}, actions: [flow] }) });
      await apiFetch(`/api/v1/automations/${auto.id}/publish`, { method: 'POST', body: JSON.stringify({ versionId: ver.id }) });
      alert('Guardado y publicado: ' + auto.id);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function dryRun() {
    setDryRunLoading(true);
    try {
      const auto = await apiFetch('/api/v1/automations', { method: 'POST', body: JSON.stringify({ name: name + ' (dry-run)', description: 'Dry run', category: 'visual' }) });
      const ver = await apiFetch(`/api/v1/automations/${auto.id}/versions`, { method: 'POST', body: JSON.stringify({ version: 1, trigger: { type: 'manual' }, conditions: {}, actions: [{ nodes, edges }] }) });
      const r = await apiFetch(`/api/v1/automations/${auto.id}/dry-run`, { method: 'POST', body: JSON.stringify({ automationId: auto.id, versionId: ver.id, event: { status: 'active' } }) });
      setDryRunResult(r);
    } catch (e: any) { setDryRunResult({ error: e.message }); }
    finally { setDryRunLoading(false); }
  }

  const filteredPalette = PALETTE.map((g) => ({
    ...g,
    items: g.items.filter((it) => it.label.toLowerCase().includes(filter.toLowerCase())),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        <input aria-label="Nombre automatización" className="px-3 py-2 border border-slate-700 rounded-md bg-slate-800 text-slate-200 text-sm" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={() => setValidationErrors(validate())} className="px-3 py-2 border border-slate-700 rounded-md text-sm text-slate-300 hover:bg-slate-700">Validar</button>
        <button onClick={dryRun} disabled={dryRunLoading} className="px-3 py-2 border border-slate-700 rounded-md text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50">{dryRunLoading ? 'Simulando...' : 'Dry Run'}</button>
        <button onClick={save} disabled={saving} className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50 hover:bg-indigo-700">{saving ? 'Guardando...' : 'Guardar y publicar'}</button>
        <input className="px-3 py-2 border border-slate-700 rounded-md bg-slate-800 text-slate-200 text-sm" placeholder="Buscar nodo..." value={filter} onChange={e => setFilter(e.target.value)} />
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-sm text-red-300">
          {validationErrors.map((e, i) => <div key={i}>• {e}</div>)}
        </div>
      )}

      <div className="flex gap-4">
        <div className="w-60 bg-slate-800 border border-slate-700 rounded-xl p-3 space-y-3 max-h-[560px] overflow-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase">Biblioteca de nodos</div>
          {filteredPalette.map((g) => (
            <div key={g.group}>
              <div className="text-xs text-slate-500 font-semibold mt-2 mb-1">{g.group}</div>
              {g.items.map((it) => (
                <button key={it.label} onClick={() => addNode(it.type, it.label, it.nodeType)} className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-300 hover:bg-slate-700 mb-1">
                  {it.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ height: 560, flex: 1 }} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <Flow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_: any, n: any) => setSelected(n)} fitView nodeTypes={nodeTypes as any}>
            <Controls className="!bg-slate-800 !border-slate-700 !text-slate-200" />
            <Background color="#334155" gap={16} />
          </Flow>
        </div>
        <div className="w-72 bg-slate-800 border border-slate-700 rounded-xl p-3">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Propiedades</div>
          {selected ? (
            <div className="space-y-3">
              <div className="text-sm text-slate-200 font-medium">{String(selected.data?.label || '')}</div>
              <div className="text-xs text-slate-500">ID: {selected.id}</div>
              <div className="text-xs text-slate-500">Tipo: {String(selected.data?.type || '')}</div>
              <label className="block text-xs text-slate-400">Nombre del nodo</label>
              <input className="w-full px-2 py-1 border border-slate-700 rounded bg-slate-700/50 text-sm text-slate-200" defaultValue={String(selected.data?.label || '')} onChange={(e) => {
                setNodes((nds) => nds.map((n) => n.id === selected.id ? { ...n, data: { ...n.data, label: e.target.value } } : n));
              }} />
            </div>
          ) : <div className="text-xs text-slate-500">Seleccioná un nodo del canvas.</div>}
          {dryRunResult && (
            <div className="mt-4 border-t border-slate-700 pt-3">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Dry Run</div>
              <pre className="text-xs text-slate-300 overflow-auto max-h-40">{JSON.stringify(dryRunResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
