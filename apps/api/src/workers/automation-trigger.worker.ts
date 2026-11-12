import { Worker } from 'bullmq';
import { prisma } from '../lib/prisma';
import IORedis from 'ioredis';
import { findCandidateAutomations } from '../modules/automation/triggers.service';
import { automationExecutionQueue } from './automation-execution.worker';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

export function startAutomationTriggerWorker() {
  const worker = new Worker('automation-triggers', async (job) => {
    const { outboxId, event } = job.data;
    const depth = (event?.metadata?.depth || 0);
    if (depth > 10) { await prisma.outboxMessage.update({ where: { id: outboxId }, data: { status: 'failed', lastError: 'Max depth exceeded' } }).catch(()=>{}); return { skipped: 'max_depth' }; }
    const candidates = await findCandidateAutomations(event);
    const created: string[] = [];
    for (const c of candidates) {
      const idempotencyKey = `${event.eventId || outboxId}-${c.automation.id}-${c.version.id}`;
      const existing = await prisma.automationExecution.findFirst({ where: { automationId: c.automation.id, idempotencyKey } });
      if (existing) { created.push(existing.id); continue; }
      const exec = await prisma.automationExecution.create({
        data: { automationId: c.automation.id, versionId: c.version.id, status: 'queued', triggerEvent: event as any, idempotencyKey },
      });
      await automationExecutionQueue.add('process', { executionId: exec.id }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
      created.push(exec.id);
    }
    // mark outbox processed
    await prisma.outboxMessage.update({ where: { id: outboxId }, data: { status: 'processed', processedAt: new Date() } }).catch(() => {});
    return { candidates: candidates.length, executions: created };
  }, { connection, concurrency: 5 });
  worker.on('failed', (job, err) => console.error('automation trigger job failed', job?.id, err?.message));
  return worker;
}
