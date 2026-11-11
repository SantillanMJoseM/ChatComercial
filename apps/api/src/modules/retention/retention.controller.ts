import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../audit/audit.controller';

export async function runRetention(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ days: z.number().int().min(1).max(3650), dryRun: z.boolean().default(true) }).parse(req.body);
    const cutoff = new Date(Date.now() - body.days * 24 * 60 * 60 * 1000);
    const oldExecs = await prisma.aIExecution.count({ where: { createdAt: { lt: cutoff } } });
    const oldAudit = await prisma.auditLog.count({ where: { createdAt: { lt: cutoff } } });
    if (!body.dryRun) {
      await prisma.aIExecution.deleteMany({ where: { createdAt: { lt: cutoff } } });
      await prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
      recordAudit((req as any).userId, 'retention.run', 'retention', undefined, { days: body.days, deletedExecs: oldExecs, deletedAudit: oldAudit }, req.ip);
    }
    res.json({ dryRun: body.dryRun, cutoff, executions: oldExecs, auditLogs: oldAudit });
  } catch (e) { next(e); }
}
