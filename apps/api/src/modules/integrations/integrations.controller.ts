import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { createWahaAdapter } from '../../adapters/waha';
import { createChatwootAdapter } from '../../adapters/chatwoot';
import { recordAudit } from '../audit/audit.controller';

const testSchema = z.object({ key: z.string() });

export async function listIntegrations(req: Request, res: Response, next: NextFunction) {
  try {
    const integrations = await prisma.integration.findMany({ orderBy: { key: 'asc' } });
    const events = await prisma.integrationEvent.groupBy({ by: ['integrationId', 'status'], _count: { _all: true } });
    res.json(integrations.map((i) => {
      const ev = events.filter((e) => e.integrationId === i.id);
      const lastEvent = ev.length ? null : null;
      return {
        id: i.id, key: i.key, name: i.name, type: i.type, isActive: i.isActive,
        baseUrl: i.baseUrl, config: i.config, createdAt: i.createdAt, updatedAt: i.updatedAt,
        eventCounts: ev.map((e) => ({ status: e.status, count: e._count._all })),
      };
    }));
  } catch (e) { next(e); }
}

export async function getIntegration(req: Request, res: Response, next: NextFunction) {
  try {
    const i = await prisma.integration.findUnique({ where: { key: req.params.key } });
    if (!i) return res.status(404).json({ error: 'Not found' });
    res.json(i);
  } catch (e) { next(e); }
}

export async function testConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.params.key;
    const integration = await prisma.integration.findUnique({ where: { key } });
    if (!integration) return res.status(404).json({ error: 'Not found' });
    const started = Date.now();
    let result: any;
    if (key === 'waha') {
      const a = createWahaAdapter();
      const status = await a.status();
      const sessions = await a.sessions();
      result = { ok: true, version: status.version, engine: status.engine, sessions: sessions.length };
    } else if (key === 'chatwoot') {
      const a = createChatwootAdapter();
      const profile = await a.profile();
      const inboxes = await a.inboxes();
      result = { ok: true, user: profile?.name || profile?.email, inboxes: Array.isArray(inboxes) ? inboxes.length : inboxes?.payload?.length };
    } else {
      return res.status(400).json({ error: 'Unknown integration' });
    }
    const duration = Date.now() - started;
    await prisma.integration.update({ where: { key }, data: { isActive: true, updatedAt: new Date() } });
    await prisma.integrationEvent.create({ data: { integrationId: integration.id, eventType: 'connection.test', payload: { duration }, status: 'processed', processedAt: new Date() } });
    recordAudit((req as any).userId, 'integration.test', 'integration', integration.id, { key, ok: true }, req.ip);
    res.json({ ...result, duration });
  } catch (e: any) {
    const integration = await prisma.integration.findUnique({ where: { key: req.params.key } });
    if (integration) {
      await prisma.integrationEvent.create({ data: { integrationId: integration.id, eventType: 'connection.test', payload: { error: e.message }, status: 'failed', lastError: e.message } }).catch(() => {});
      await prisma.integration.update({ where: { key: req.params.key }, data: { isActive: false } }).catch(() => {});
    }
    res.status(502).json({ ok: false, error: e.message });
  }
}

export async function patchIntegration(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ isActive: z.boolean().optional(), baseUrl: z.string().optional(), config: z.any().optional() }).parse(req.body);
    const updated = await prisma.integration.update({ where: { key: req.params.key }, data: body });
    res.json(updated);
  } catch (e) { next(e); }
}
