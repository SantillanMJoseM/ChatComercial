'use client';
import { useCallback, useState, useEffect } from 'react';
import { ReactFlow, Controls, Background, addEdge, useNodesState, useEdgesState, Handle, Position } from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

const CATEGORIES: Record<string, { color: string; icon: string }> = {
  trigger: { color: 'bg-indigo-600', icon: '⚡' },
  condition: { color: 'bg-amber-600', icon: '🔀' },
  action: { color: 'bg-emerald-600', icon: '▶' },
  control: { color: 'bg-slate-600', icon: '⏹' },
};

const PALETTE = [
  { group: 'Disparadores', items: [
    { type: 'trigger', label: 'Evento client.created', nodeType: 'trigger' },
    { type: 'trigger', label: 'Evento conversation.created', nodeType: 'trigger' },
    { type: 'trigger', label: 'Evento manual', nodeType: 'trigger' },
  ]},
  { group: 'Condiciones', items: [
    { type: 'condition', label: 'Si / Entonces', nodeType: 'condition' },
    { type: 'condition', label: 'Comparar texto', nodeType: 'condition' },
    { type: 'condition', label: 'Comparar número', nodeType: 'condition' },
  ]},
  { group: 'Acciones', items: [
    { type: 'action', label: 'Enviar notificación', nodeType: 'action' },
    { type: 'action', label: 'Crear nota', nodeType: 'action' },
    { type: 'action', label: 'Agregar etiqueta', nodeType: 'action' },
    { type: 'action', label: 'Ejecutar skill', nodeType: 'action' },
    { type: 'action', label: 'Consultar RAG', nodeType: 'action' },
    { type: 'action', label: 'Derivar a operador', nodeType: 'action' },
    { type: 'action', label: 'Generar reporte', nodeType: 'action' },
  ]},
  { group: 'Control', items: [
    { type: 'control', label: 'Esperar', nodeType: 'control' },
    { type: 'control', label: 'Finalizar flujo', nodeType: 'control' },
  ]},
];

const VARIABLES = [
  { key: '{{contact.name}}', desc: 'Nombre del contacto' },
  { key: '{{contact.phone}}', desc: 'Teléfono del contacto' },
  { key: '{{contact.email}}', desc: 'Email del contacto' },
  { key: '{{conversation.id}}', desc: 'ID de conversación' },
  { key: '{{conversation.status}}', desc: 'Estado de conversación' },
  { key: '{{message.content}}', desc: 'Contenido del mensaje' },
  { key: '{{ai.response}}', desc: 'Respuesta de IA' },
  { key: '{{flow.execution_id}}', desc: 'ID de ejecución' },
];

function CustomNode({ data }: { data: any }) {
  const type = data?.type || 'action';
  const color = CATEGORIES[type]?.color || 'bg-slate-600';
  const icon = CATEGORIES[type]?.icon || '▶';
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 shadow-md min-w-[180px]">
      <div className={`${color} text-white text-xs font-semibold px-3 py-1.5 rounded-t-lg flex items-center gap-2`}>
        <span>{icon}</span>
        <span className="truncate">{String(data?.label || '')}</span>
      </div>
      <div className="px-3 py-2 text-xs text-slate-400">{type}</div>
      <Handle type="target" position={Position.Left} className="!bg-indigo-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-400 !w-3 !h-3" />
    </div>
  );
}
const nodeTypes = { custom: CustomNode };

function detectCycles(nodes: Node[], edges: Edge[]): boolean {
  const adj: Record<string, string[]> = {};
  for (const n of nodes) adj[n.id] = [];
  for (const e of edges) { if (adj[e.source]) adj[e.source].push(e.target); }
  const visited = new Set<string>();
  const stack = new Set<string>();
  function dfs(u: string): boolean {
    visited.add(u); stack.add(u);
    for (const v of (adj[u] || [])) {
      if (!visited.has(v)) { if (dfs(v)) return true; }
      else if (stack.has(v)) return true;
    }
    stack.delete(u);
    return false;
  }
  for (const n of nodes) { if (!visited.has(n.id)) { if (dfs(n.id)) return true; } }
  return false;
}

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
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [propForm, setPropForm] = useState({ label: '', varKey: '' });

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const addNode = (type: string, label: string) => {
    const id = `${type}-${Date.now()}`;
    setNodes((nds) => [...nds, { id, position: { x: 260, y: 120 + nds.length * 90 }, data: { label, type, config: {} }, type: 'custom' }]);
  };

  const deleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    if (selected?.id === id) setSelected(null);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selNodes = nodes.filter((n) => n.selected);
        const selEdges = edges.filter((e) => e.selected);
        selNodes.forEach((n) => deleteNode(n.id));
        if (selEdges.length) setEdges((eds) => eds.filter((e) => !e.selected));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nodes, edges, selected]);

  function validate(): string[] {
    const errors: string[] = [];
    if (!nodes.some((n) => n.data?.type === 'trigger')) errors.push('Falta un nodo disparador.');
    if (nodes.length < 2) errors.push('El flujo debe tener al menos un nodo.');
    const connected = new Set(edges.flatMap((e) => [e.source, e.target]));
    for (const n of nodes) {
      if (n.data?.type !== 'trigger' && !connected.has(n.id)) errors.push(`Nodo "${n.data?.label}" está desconectado.`);
    }
    if (detectCycles(nodes, edges)) errors.push('Se detectó un ciclo en el flujo.');
    for (const n of nodes) {
      if (!n.data?.label) errors.push(`Nodo ${n.id} sin nombre.`);
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

  const updateNodeLabel = (id: string, label: string) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label } } : n));
    if (selected?.id === id) setSelected((s) => s ? { ...s, data: { ...s.data, label } } : s);
  };

  const Flow = ReactFlow as any;
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
        <div className="w-64 bg-slate-800 border border-slate-700 rounded-xl p-3 space-y-3 max-h-[600px] overflow-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase">Biblioteca de nodos</div>
          {filteredPalette.map((g) => (
            <div key={g.group}>
              <div className="text-xs text-slate-500 font-semibold mt-2 mb-1">{g.group}</div>
              {g.items.map((it) => (
                <button key={it.label} onClick={() => addNode(it.type, it.label)} className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-300 hover:bg-slate-700 mb-1">
                  {it.label}
                </button>
              ))}
            </div>
          ))}
          <div className="mt-4 border-t border-slate-700 pt-3">
            <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Variables</div>
            {VARIABLES.map((v) => (
              <div key={v.key} className="text-xs text-slate-400 py-0.5">
                <code className="text-indigo-400">{v.key}</code> — {v.desc}
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 600, flex: 1 }} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <Flow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_: any, n: any) => setSelected(n)} fitView nodeTypes={nodeTypes}>
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
              <input className="w-full px-2 py-1 border border-slate-700 rounded bg-slate-700/50 text-sm text-slate-200" defaultValue={String(selected.data?.label || '')} onChange={(e) => updateNodeLabel(selected.id, e.target.value)} />
              <button onClick={() => { setNodes((nds) => nds.filter((n) => n.id !== selected.id)); setEdges((eds) => eds.filter((e) => e.source !== selected.id && e.target !== selected.id)); setSelected(null); }} className="w-full bg-red-600 text-white rounded-md px-3 py-1.5 text-sm hover:bg-red-700">Eliminar nodo</button>
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
