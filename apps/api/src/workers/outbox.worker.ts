import { Worker, Queue } from 'bullmq';
import { prisma } from '../lib/prisma';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

export const outboxQueue = new Queue('outbox', { connection });

export function startOutboxWorker() {
  const worker = new Worker('outbox', async (job) => {
    const msg = await prisma.outboxMessage.findUnique({ where: { id: job.data.id } });
    if (!msg || msg.status !== 'pending') return;
    // F1+: dispatch by aggregate/eventType
    await prisma.outboxMessage.update({ where: { id: msg.id }, data: { status: 'processed', processedAt: new Date() } });
  }, { connection });
  worker.on('failed', (job, err) => console.error('outbox job failed', job?.id, err?.message));
  return worker;
}
