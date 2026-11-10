import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const createSchema = z.object({ name: z.string().min(1), description: z.string().optional() });
const addMemberSchema = z.object({ userId: z.string().uuid(), role: z.string().optional() });

export async function listTeams(req: Request, res: Response, next: NextFunction) {
  try {
    const teams = await prisma.team.findMany({ where: { deletedAt: null }, include: { members: { include: { user: true } } }, orderBy: { name: 'asc' } });
    res.json(teams.map((t) => ({
      id: t.id, name: t.name, description: t.description, isActive: t.isActive,
      members: t.members.map((m) => ({ userId: m.userId, name: m.user.name, email: m.user.email, role: m.role })),
    })));
  } catch (e) { next(e); }
}

export async function createTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createSchema.parse(req.body);
    const team = await prisma.team.create({ data: body });
    res.status(201).json(team);
  } catch (e) { next(e); }
}

export async function addTeamMember(req: Request, res: Response, next: NextFunction) {
  try {
    const body = addMemberSchema.parse(req.body);
    const m = await prisma.teamMember.create({ data: { teamId: req.params.id, userId: body.userId, role: body.role || 'member' } });
    res.status(201).json(m);
  } catch (e) { next(e); }
}
