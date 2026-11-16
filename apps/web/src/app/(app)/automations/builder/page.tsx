'use client';
import { useCallback, useState, useEffect } from 'react';
import { ReactFlow, Controls, Background, addEdge, useNodesState, useEdgesState, Handle, Position } from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

const PALETTE = [
  { group: 'Disparadores', items: [
    { type: 'trigger', label: 'Evento client.created', nodeType: 'input' },
    { type: 'trigger', label: 'Evento conversation.created', nodeType: 'input' },
    { type: 'trigger', label: 'Evento manual', nodeType: 'input' },
    { type: 'trigger', label: 'Programado (cron)', nodeType: 'input' },
  ]},
  { group: 'Condiciones', items: [
    { type: 'condition', label: 'Si / Entonces', nodeType: 'default' },
    { type: 'condition', label: 'Comparar texto', nodeType: 'default' },
    { type: 'condition', label: 'Comparar número', nodeType: 'default' },
    { type: 'condition', label: 'Verificar existencia', nodeType: 'default' },
  ]},
  { group: 'CRM', items: [
    { type: 'action', label: 'Buscar cliente', nodeType: 'default' },
    { type: 'action', label: 'Crear cliente', nodeType: 'default' },
    { type: 'action', label: 'Actualizar cliente', nodeType: 'default' },
    { type: 'action', label: 'Agregar etiqueta', nodeType: 'default' },
    { type: 'action', label: 'Agregar nota', nodeType: 'default' },
  ]},
  { group: 'Mensajería', items: [
    { type: 'action', label: 'Enviar notificación', nodeType: 'default' },
    { type: 'action', label: 'Enviar WhatsApp (simulado)', nodeType: 'default' },
    { type: 'action', label: 'Mensaje al operador', nodeType: 'default' },
  ]},
  { group: 'Chatwoot', items: [
    { type: 'action', label: 'Asignar operador', nodeType: 'default' },
    { type: 'action', label: 'Asignar equipo', nodeType: 'default' },
    { type: 'action', label: 'Cambiar estado conv.', nodeType: 'default' },
    { type: 'action', label: 'Derivar a operador', nodeType: 'default' },
  ]},
  { group: 'Inteligencia', items: [
    { type: 'action', label: 'Ejecutar skill', nodeType: 'default' },
    { type: 'action', label: 'Consultar RAG', nodeType: 'default' },
    { type: 'action', label: 'Solicitar asistencia IA', nodeType: 'default' },
    { type: 'action', label: 'Clasificar intención', nodeType: 'default' },
    { type: 'action', label: 'Resumir conversación', nodeType: 'default' },
  ]},
  { group: 'Control', items: [
    { type: 'control', label: 'Esperar', nodeType: 'default' },
    { type: 'control', label: 'Dividir caminos', nodeType: 'default' },
    { type: 'control', label: 'Finalizar flujo', nodeType: 'output' },
    { type: 'control', label: 'Manejar error', nodeType: 'default' },
  ]},
];

const NODE_COLORS: Record<string, string> = {
  trigger: 'bg-emerald-600',
  condition: 'bg-amber-600',
  action: 'bg-indigo-600',
  control: 'bg-slate-600',
};

function CustomNode({ data }: { data: any }) {
  const type = data?.type || 'action';
  const color = type === 'trigger' ? 'bg-indigo-600' : type === 'condition' ? 'bg-amber-600' : type === 'control' ? 'bg-slate-600' : 'bg-emerald-600';
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 shadow-md min-w-[160px]">
      <div className={`${color} text-white text-xs font-semibold px-3 py-1.5 rounded-t-lg`}>{String(data?.label || '')}</div>
      <div className="px-3 py-2 text-xs text-slate-400">{type}</div>
      <Handle type="target" position={Position.Left} className="!bg-indigo-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-400 !w-3 !h-3" />
    </div>
  );
}
const nodeTypes = { custom: CustomNode };

export default function AutomationBuilderPage() {
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = nodes.filter((n) => n.selected);
        const selectedEdges = edges.filter((e) => e.selected);
        if (selectedNodes.length) { selectedNodes.forEach((n) => deleteNode(n.id)); }
        if (selectedEdges.length) { deleteSelectedEdge(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nodes, edges, selected]);
  const [dryRunLoading, setDryRunLoading] = useState(false);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const deleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    if (selected?.id === id) setSelected(null);
  };

  const deleteSelectedEdge = () => {
    setEdges((eds) => eds.filter((e) => !e.selected));
  };

  const addNode = (type: string, label: string, nodeType: string) => {
    const id = `${type}-${Date.now()}`;
    setNodes((nds) => [...nds, { id, position: { x: 260, y: 120 + nds.length * 90 }, data: { label, type }, type: 'custom' }]);
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
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_, n: any) => setSelected(n)} fitView nodeTypes={nodeTypes}>
            <Controls />
            <Background color="#334155" gap={16} />
          </ReactFlow>
        </div>
        <div className="w-72 bg-slate-800 border border-slate-700 rounded-xl p-3">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Propiedades</div>
          {selected ? (
            <div className="space-y-3">
              <div className="text-sm text-slate-200 font-medium">{String(selected.data?.label || '')}</div>
              <div className="text-xs text-slate-500">ID: {selected.id}</div>
              <div className="text-xs text-slate-500">Tipo: {String(selected.data?.type || '')}</div>
              <label className="block text-xs text-slate-400">Nombre del nodo</label>
              <button onClick={() => deleteNode(selected.id)} className="w-full bg-red-600 text-white rounded-md px-3 py-1.5 text-sm hover:bg-red-700 mb-2">Eliminar nodo</button>
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
