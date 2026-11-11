import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export async function listAssignmentHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const conversationId = req.query.conversationId as string | undefined;
    const where: any = {};
    if (conversationId) where.conversationRefId = conversationId;
    const items = await prisma.assignmentHistory.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200, include: { fromUser: true, toUser: true, fromTeam: true, toTeam: true, actor: true } });
    res.json(items);
  } catch (e) { next(e); }
}
