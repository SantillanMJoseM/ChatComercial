import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import Redis from 'ioredis';

let redisClient: Redis | null = null;
function getRedis() {
  if (!redisClient) redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { lazyConnect: true, maxRetriesPerRequest: 1 });
  return redisClient;
}

export async function health(req: Request, res: Response) {
  res.json({ status: 'ok', service: 'api', timestamp: new Date().toISOString() });
}

export async function ready(req: Request, res: Response) {
  const checks: Record<string, string> = {};
  let ok = true;
  try { await prisma.$queryRaw`SELECT 1`; checks.database = 'ok'; } catch (e) { checks.database = 'fail'; ok = false; }
  try {
    const r = getRedis();
    await r.ping();
    checks.redis = 'ok';
  } catch (e) { checks.redis = 'fail'; ok = false; }
  res.status(ok ? 200 : 503).json({ status: ok ? 'ready' : 'not_ready', checks, timestamp: new Date().toISOString() });
}

export async function systemStatus(req: Request, res: Response) {
  const checks: Record<string, string> = {};
  try { await prisma.$queryRaw`SELECT 1`; checks.database = 'ok'; } catch (e) { checks.database = 'fail'; }
  try { const r = getRedis(); await r.ping(); checks.redis = 'ok'; } catch (e) { checks.redis = 'fail'; }
  const overall = Object.values(checks).every((v) => v === 'ok') ? 'ok' : 'degraded';
  res.json({ status: overall, service: 'commercial-attention-platform', version: '0.1.0', checks, timestamp: new Date().toISOString() });
}
