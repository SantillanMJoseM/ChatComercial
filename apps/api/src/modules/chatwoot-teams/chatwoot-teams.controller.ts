import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { createChatwootAdapter } from '../../adapters/chatwoot';
import { recordAudit } from '../audit/audit.controller';

export async function listChatwootTeams(req: Request, res: Response, next: NextFunction) {
  try {
    const adapter = createChatwootAdapter();
    const teams = await adapter.teams();
    const links = await prisma.chatwootTeamLink.findMany();
    res.json({ chatwoot: teams, links });
  } catch (e) { next(e); }
}

export async function createChatwootTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ name: z.string().min(1), description: z.string().optional(), localTeamId: z.string().uuid().optional() }).parse(req.body);
    const adapter = createChatwootAdapter();
    const acct = process.env.CHATWOOT_ACCOUNT_ID;
    const created = await adapter.request(`/api/v1/accounts/${acct}/teams`, { method: 'POST', body: JSON.stringify({ name: body.name, description: body.description, allow_auto_assign: true }) });
    const link = await prisma.chatwootTeamLink.create({ data: { localTeamId: body.localTeamId, chatwootTeamId: created.id, name: created.name } });
    recordAudit((req as any).userId, 'chatwoot.team.create', 'chatwoot_team', String(created.id), { name: created.name }, req.ip);
    res.status(201).json({ chatwoot: created, link });
  } catch (e) { next(e); }
}

export async function linkChatwootTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ localTeamId: z.string().uuid(), chatwootTeamId: z.number().int(), name: z.string() }).parse(req.body);
    const link = await prisma.chatwootTeamLink.upsert({
      where: { chatwootTeamId: body.chatwootTeamId },
      update: { localTeamId: body.localTeamId, name: body.name },
      create: { localTeamId: body.localTeamId, chatwootTeamId: body.chatwootTeamId, name: body.name },
    });
    res.json(link);
  } catch (e) { next(e); }
}
