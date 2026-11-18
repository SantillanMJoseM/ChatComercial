import { prisma } from '../../../lib/prisma';

export interface GraphNode { id: string; data?: { label?: string; type?: string; config?: any }; }
export interface GraphEdge { id: string; source: string; target: string; label?: string; }

export interface StepResult { nodeId: string; label: string; type: string; status: string; input?: any; output?: any; error?: string; durationMs: number; }

export interface ExecutionResult {
  executionId: string;
  status: string;
  steps: StepResult[];
  context: Record<string, any>;
  error?: string;
}

function resolveVars(text: string, ctx: Record<string, any>): string {
  if (typeof text !== 'string') return text;
  return text.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const k = key.trim();
    if (ctx[k] !== undefined) return String(ctx[k]);
    return `{{${k}}}`;
  });
}

function getNodeLabel(n: GraphNode) { return n.data?.label || n.id; }
function getNodeType(n: GraphNode) { return n.data?.type || 'action'; }

export async function executeGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  initialContext: Record<string, any> = {},
  dryRun = true
): Promise<{ steps: StepResult[]; context: Record<string, any>; status: string; error?: string }> {
  const ctx: Record<string, any> = { ...initialContext };
  const steps: StepResult[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  let current: GraphNode | undefined = nodes.find((n) => getNodeType(n) === 'trigger');
  if (!current) current = nodes[0];
  let stepsCount = 0;
  const MAX_STEPS = 50;

  while (current && stepsCount < MAX_STEPS) {
    stepsCount++;
    if (visited.has(current.id)) {
      steps.push({ nodeId: current.id, label: getNodeLabel(current), type: getNodeType(current), status: 'failed', error: 'Cycle detected', durationMs: 0 });
      return { steps, context: ctx, status: 'failed', error: 'Cycle detected' };
    }
    visited.add(current.id);
    const start = Date.now();
    const type = getNodeType(current);
    const label = getNodeLabel(current);

    // Execute node logic (simulated)
    let output: any = null;
    let error: string | null = null;
    try {
      if (type === 'trigger') {
        output = { triggered: true };
      } else if (type === 'condition') {
        // evaluate condition from config
        const cond = current.data?.config?.condition || 'true';
        const result = ctx[cond] === true || cond === 'true';
        output = { result };
      } else if (type === 'action') {
        const lbl = (label || '').toLowerCase();
        if (lbl.includes('buscar') || lbl.includes('search')) {
          // mock client lookup
          const phone = ctx['contact.phone'] || '+5491112345678';
          ctx['customer.exists'] = true;
          ctx['customer.id'] = 'cust-1';
          ctx['customer.firstName'] = 'Cliente de prueba';
          ctx['customer.type'] = 'existing';
          output = { found: true, name: ctx['customer.firstName'], phone };
        } else if (lbl.includes('bienvenida') || lbl.includes('mensaje') || lbl.includes('welcome')) {
          const msg = resolveVars('Hola {{contact.name}}, gracias por comunicarte.', ctx);
          ctx['message.prepared'] = msg;
          output = { message: msg };
        } else if (lbl.includes('nota') || lbl.includes('note')) {
          output = { noteCreated: true };
        } else if (lbl.includes('etiqueta') || lbl.includes('tag')) {
          output = { tagged: true };
        } else if (lbl.includes('skill') || lbl.includes('rag') || lbl.includes('ia') || lbl.includes('asistente')) {
          output = { executed: true, result: 'mock' };
        } else if (lbl.includes('derivar') || lbl.includes('handoff')) {
          output = { handoff: true };
        } else if (lbl.includes('reporte')) {
          output = { report: 'generated' };
        } else {
          output = { executed: true };
        }
      } else if (type === 'control') {
        if (label.toLowerCase().includes('finalizar') || label.toLowerCase().includes('fin')) {
          output = { finished: true };
        } else {
          output = { waited: true };
        }
      }
    } catch (e: any) {
      error = e.message;
    }

    const duration = Date.now() - start;
    steps.push({ nodeId: current.id, label, type, status: error ? 'failed' : 'completed', input: { ...ctx }, output, error: error ?? undefined, durationMs: duration });

    if (error) return { steps, context: ctx, status: 'failed', error };

    // pick next node
    const outgoing = edges.filter((e) => e.source === current!.id);
    if (outgoing.length === 0) break;

    if (type === 'condition') {
      const condResult = (steps[steps.length - 1].output as any)?.result ?? true;
      const branchLabel = condResult ? 'TRUE' : 'FALSE';
      const branch = outgoing.find((e) => (e.label || '').toUpperCase() === branchLabel) || outgoing.find((e) => (e.label || '').toUpperCase().includes(condResult ? 'TRUE' : 'FALSE')) || outgoing[0];
      current = nodeMap.get(branch.target);
    } else {
      current = nodeMap.get(outgoing[0].target);
    }
  }

  return { steps, context: ctx, status: 'completed' };
}
