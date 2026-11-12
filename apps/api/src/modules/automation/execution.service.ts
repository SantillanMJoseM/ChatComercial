import { prisma } from '../../lib/prisma';
import { evaluateConditions } from './conditions/evaluator';
import { executeAction } from './actions/executor';

export async function processAutomationExecution(executionId: string) {
  const exec = await prisma.automationExecution.findUnique({ where: { id: executionId }, include: { version: true, automation: true } });
  if (!exec || !exec.version) return;
  if (exec.status !== 'queued' && exec.status !== 'running') return;

  await prisma.automationExecution.update({ where: { id: executionId }, data: { status: 'running', startedAt: new Date() } });

  const version = exec.version;
  const conditions = version.conditions;
  const actions = (version.actions as any[]) || [];
  const ctx = (exec.triggerEvent as any) || {};

  // evaluate conditions
  const condResult = evaluateConditions(conditions, ctx);
  await prisma.automationExecutionStep.create({ data: { executionId, stepIndex: 0, type: 'condition', status: condResult.result ? 'completed' : 'skipped', input: conditions as any, output: { result: condResult.result, details: condResult.details } as any } });

  if (!condResult.result) {
    await prisma.automationExecution.update({ where: { id: executionId }, data: { status: 'completed', finishedAt: new Date() } });
    return;
  }

  // execute actions sequentially
  let stepIndex = 1;
  let hasFailure = false;
  for (const action of actions) {
    const step = await prisma.automationExecutionStep.create({ data: { executionId, stepIndex, type: action.type, status: 'running', input: action.params } });
    const result = await executeAction(action, { userId: exec.automation?.createdBy });
    await prisma.automationExecutionStep.update({ where: { id: step.id }, data: { status: result.success ? 'completed' : 'failed', output: result.output, error: result.error, finishedAt: new Date() } });
    if (!result.success) hasFailure = true;
    stepIndex++;
    // max steps guard
    if (stepIndex > 50) { hasFailure = true; break; }
  }

  await prisma.automationExecution.update({ where: { id: executionId }, data: { status: hasFailure ? 'partially_completed' : 'completed', finishedAt: new Date() } });
}
