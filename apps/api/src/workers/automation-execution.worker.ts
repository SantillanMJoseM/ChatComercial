import { Worker, Queue } from 'bullmq';
import { prisma } from '../lib/prisma';
import IORedis from 'ioredis';
import { processAutomationExecution } from '../modules/automation/execution.service';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
export const automationExecutionQueue = new Queue('automation-executions', { connection });

export function startAutomationExecutionWorker() {
  const worker = new Worker('automation-executions', async (job) => {
    await processAutomationExecution(job.data.executionId);
  }, { connection, concurrency: 3 });
  worker.on('failed', (job, err) => console.error('automation execution job failed', job?.id, err?.message));
  return worker;
}
