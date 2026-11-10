import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
const webhookQueue = new Queue('webhooks', { connection });

async function persistEvent(integrationKey: string, eventType: string, payload: any, dedupId?: string) {
  const integration = await prisma.integration.findUnique({ where: { key: integrationKey } });
  if (!integration) throw new Error('Integration not found');
  // dedup
  if (dedupId) {
    const existing = await prisma.integrationEvent.findFirst({
      where: { integrationId: integration.id, eventType, payload: { path: ['_dedupId'], equals: dedupId } as any },
    }).catch(() => null);
    if (existing) return { duplicate: true, event: existing };
  }
  const event = await prisma.integrationEvent.create({
    data: { integrationId: integration.id, eventType, payload: { ...payload, _dedupId: dedupId }, status: 'pending' },
  });
  await webhookQueue.add('process', { eventId: event.id }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  return { duplicate: false, event };
}

export async function wahaWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    // optional secret validation via query token
    const token = (req.query.token as string) || req.headers['x-webhook-token'];
    if (process.env.WAHA_WEBHOOK_TOKEN && token !== process.env.WAHA_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const payload = req.body || {};
    const eventType = payload.event || payload.type || 'waha.event';
    const dedupId = payload.id || payload.messageId || payload.session;
    const r = await persistEvent('waha', eventType, payload, dedupId);
    res.status(r.duplicate ? 200 : 202).json({ ok: true, duplicate: r.duplicate, eventId: r.event.id });
  } catch (e) { next(e); }
}

export async function chatwootWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req.query.token as string) || req.headers['x-webhook-token'];
    if (process.env.CHATWOOT_WEBHOOK_TOKEN && token !== process.env.CHATWOOT_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const payload = req.body || {};
    const eventType = payload.event || 'chatwoot.event';
    const dedupId = payload.id || payload.conversation?.id;
    const r = await persistEvent('chatwoot', eventType, payload, dedupId);
    res.status(r.duplicate ? 200 : 202).json({ ok: true, duplicate: r.duplicate, eventId: r.event.id });
  } catch (e) { next(e); }
}
