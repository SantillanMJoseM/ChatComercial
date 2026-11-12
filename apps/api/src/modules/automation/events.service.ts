import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
export const automationTriggerQueue = new Queue('automation-triggers', { connection });

export const eventSchema = z.object({
  eventId: z.string().optional(),
  eventType: z.string().min(1),
  source: z.string().default('internal'),
  occurredAt: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  actorId: z.string().optional(),
  correlationId: z.string().optional(),
  causationId: z.string().optional(),
  payload: z.any().optional(),
  metadata: z.any().optional(),
});

export type NormalizedEvent = z.infer<typeof eventSchema> & { receivedAt: string };

export async function ingestEvent(raw: any): Promise<{ event: NormalizedEvent; duplicate: boolean }> {
  const parsed = eventSchema.parse(raw);
  const event: NormalizedEvent = {
    ...parsed,
    eventId: parsed.eventId || crypto.randomUUID(),
    occurredAt: parsed.occurredAt || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
  };

  // persist to OutboxMessage
  const outbox = await prisma.outboxMessage.create({
    data: {
      aggregate: event.entityType || 'system',
      eventType: event.eventType,
      payload: { ...event },
      status: 'pending',
    },
  });

  // enqueue
  await automationTriggerQueue.add('process', { outboxId: outbox.id, event }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });

  return { event, duplicate: false };
}
 
export function validateEvent(raw: any) {
  return eventSchema.safeParse(raw);
}
