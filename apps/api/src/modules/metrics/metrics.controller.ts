import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export async function getMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const [totalClients, newClients30d, convByStatus, operators] = await Promise.all([
      prisma.client.count({ where: { deletedAt: null } }),
      prisma.client.count({ where: { deletedAt: null, createdAt: { gte: new Date(Date.now() - 30*24*60*60*1000) } } }),
      prisma.conversationReference.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.operatorProfile.count(),
    ]);
    const convByOperator = await prisma.conversationReference.groupBy({ by: ['localAssigneeId'], _count: { _all: true } });
    const convByTeam = await prisma.conversationReference.groupBy({ by: ['localTeamId'], _count: { _all: true } });
    res.json({
      source: { crm: 'cap-postgres', conversations: 'chatwoot (synced references)' },
      clients: { total: totalClients, newLast30Days: newClients30d },
      conversations: { byStatus: convByStatus.map((c: any) => ({ status: c.status, count: c._count._all })) },
      operators: { total: operators },
      conversationsByOperator: convByOperator,
      conversationsByTeam: convByTeam,
    });
  } catch (e) { next(e); }
}
