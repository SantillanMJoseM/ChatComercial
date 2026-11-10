import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export async function listAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { actor: true } });
    res.json(logs.map((l) => ({
      id: l.id, actorId: l.actorId, actorEmail: l.actor?.email, action: l.action, resource: l.resource,
      resourceId: l.resourceId, metadata: l.metadata, ipAddress: l.ipAddress, createdAt: l.createdAt,
    })));
  } catch (e) { next(e); }
}

export async function recordAudit(actorId: string | null, action: string, resource: string, resourceId?: string, metadata?: any, ip?: string) {
  try {
    await prisma.auditLog.create({ data: { actorId: actorId || undefined, action, resource, resourceId, metadata, ipAddress: ip } });
  } catch {}
}
