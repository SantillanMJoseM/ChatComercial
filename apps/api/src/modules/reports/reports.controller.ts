import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

function dateRange(req: Request) {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  return { from, to };
}

export async function overview(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = dateRange(req);
    const [totalClients, newClients, totalConvs, operators, automations, aiQueries] = await Promise.all([
      prisma.client.count({ where: { deletedAt: null } }),
      prisma.client.count({ where: { deletedAt: null, createdAt: { gte: from, lte: to } } }),
      prisma.conversationReference.count(),
      prisma.operatorProfile.count(),
      prisma.automation.count({ where: { deletedAt: null } }),
      prisma.aIExecution.count({ where: { createdAt: { gte: from, lte: to } } }),
    ]);
    const convByStatus = await prisma.conversationReference.groupBy({ by: ['status'], _count: { _all: true } });
    res.json({ period: { from, to }, clients: { total: totalClients, new: newClients }, conversations: { total: totalConvs, byStatus: convByStatus.map((c) => ({ status: c.status, count: c._count._all })) }, operators: { total: operators }, automations: { total: automations }, ai: { queries: aiQueries } });
  } catch (e) { next(e); }
}

export async function attention(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = dateRange(req);
    const convs = await prisma.conversationReference.findMany({ where: { createdAt: { gte: from, lte: to } } });
    const byStatus = await prisma.conversationReference.groupBy({ by: ['status'], _count: { _all: true } });
    const byTeam = await prisma.conversationReference.groupBy({ by: ['localTeamId'], _count: { _all: true } });
    res.json({ period: { from, to }, total: convs.length, byStatus: byStatus.map((c) => ({ status: c.status, count: c._count._all })), byTeam: byTeam.map((c) => ({ teamId: c.localTeamId, count: c._count._all })) });
  } catch (e) { next(e); }
}

export async function operators(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = dateRange(req);
    const byOp = await prisma.conversationReference.groupBy({ by: ['localAssigneeId'], _count: { _all: true } });
    const profiles = await prisma.operatorProfile.findMany({ include: { user: true } });
    res.json({ period: { from, to }, operators: profiles.map((p) => ({ id: p.userId, email: p.user.email, availability: p.availability, conversations: byOp.find((b) => b.localAssigneeId === p.userId)?._count._all || 0 })) });
  } catch (e) { next(e); }
}

export async function teams(req: Request, res: Response, next: NextFunction) {
  try {
    const byTeam = await prisma.conversationReference.groupBy({ by: ['localTeamId'], _count: { _all: true } });
    const teams = await prisma.team.findMany({ where: { deletedAt: null } });
    res.json({ teams: teams.map((t) => ({ id: t.id, name: t.name, conversations: byTeam.find((b) => b.localTeamId === t.id)?._count._all || 0 })) });
  } catch (e) { next(e); }
}

export async function automations(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = dateRange(req);
    const execs = await prisma.automationExecution.findMany({ where: { startedAt: { gte: from, lte: to } } });
    const byStatus = await prisma.automationExecution.groupBy({ by: ['status'], _count: { _all: true } });
    const total = execs.length;
    const completed = execs.filter((e) => e.status === 'completed').length;
    const failed = execs.filter((e) => e.status === 'failed' || e.status === 'partially_completed').length;
    res.json({ period: { from, to }, total, completed, failed, successRate: total ? completed / total : 0, byStatus: byStatus.map((b) => ({ status: b.status, count: b._count._all })) });
  } catch (e) { next(e); }
}

export async function ai(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = dateRange(req);
    const execs = await prisma.aIExecution.findMany({ where: { createdAt: { gte: from, lte: to } } });
    const usage = await prisma.aIUsageRecord.groupBy({ by: ['providerKey'], _sum: { inputTokens: true, outputTokens: true }, _count: { _all: true } });
    const total = execs.length;
    const abstained = execs.filter((e) => e.abstained).length;
    const failed = execs.filter((e) => e.status === 'failed').length;
    res.json({ period: { from, to }, total, abstained, failed, answered: total - abstained - failed, usage: usage.map((u) => ({ provider: u.providerKey, requests: u._count._all, inputTokens: u._sum.inputTokens, outputTokens: u._sum.outputTokens })) });
  } catch (e) { next(e); }
}

export async function commercial(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = dateRange(req);
    const newClients = await prisma.client.count({ where: { deletedAt: null, createdAt: { gte: from, lte: to } } });
    const totalClients = await prisma.client.count({ where: { deletedAt: null } });
    const byStatus = await prisma.client.groupBy({ by: ['status'], _count: { _all: true } });
    const interactions = await prisma.clientInteraction.count({ where: { occurredAt: { gte: from, lte: to } } });
    res.json({ period: { from, to }, totalClients, newClients, byStatus: byStatus.map((b) => ({ status: b.status, count: b._count._all })), interactions });
  } catch (e) { next(e); }
}

export async function trends(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = dateRange(req);
    // daily client counts
    const clients = await prisma.client.findMany({ where: { deletedAt: null, createdAt: { gte: from, lte: to } }, select: { createdAt: true } });
    const byDay: Record<string, number> = {};
    for (const c of clients) { const d = c.createdAt.toISOString().slice(0, 10); byDay[d] = (byDay[d] || 0) + 1; }
    res.json({ period: { from, to }, clientsByDay: Object.entries(byDay).map(([date, count]) => ({ date, count })) });
  } catch (e) { next(e); }
}
