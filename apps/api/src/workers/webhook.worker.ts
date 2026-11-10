import { Worker } from 'bullmq';
import { prisma } from '../lib/prisma';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

export function startWebhookWorker() {
  const worker = new Worker('webhooks', async (job) => {
    const event = await prisma.integrationEvent.findUnique({ where: { id: job.data.eventId } });
    if (!event || event.status === 'processed') return;
    // F1: routing logic placeholder (no auto AI replies)
    await prisma.integrationEvent.update({ where: { id: event.id }, data: { status: 'processed', processedAt: new Date(), attempts: event.attempts + 1 } });
  }, { connection });
  worker.on('failed', async (job, err) => {
    if (job) await prisma.integrationEvent.update({ where: { id: job.data.eventId }, data: { status: 'failed', lastError: err.message, attempts: { increment: 1 } } }).catch(() => {});
  });
  return worker;
}
