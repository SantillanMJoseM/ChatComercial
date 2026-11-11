import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const profileSchema = z.object({
  userId: z.string().uuid(),
  availability: z.string().optional(),
  workingHours: z.any().optional(),
  chatwootAgentId: z.number().int().optional(),
});

export async function listOperators(req: Request, res: Response, next: NextFunction) {
  try {
    const profiles = await prisma.operatorProfile.findMany({ include: { user: { include: { roles: { include: { role: true } } } } } });
    res.json(profiles);
  } catch (e) { next(e); }
}

export async function createOperatorProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const body = profileSchema.parse(req.body);
    const profile = await prisma.operatorProfile.create({ data: body });
    res.status(201).json(profile);
  } catch (e) { next(e); }
}

export async function updateOperatorProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const body = profileSchema.partial().omit({ userId: true }).parse(req.body);
    const profile = await prisma.operatorProfile.update({ where: { id: req.params.id }, data: body });
    res.json(profile);
  } catch (e) { next(e); }
}

export async function getOperatorProfileByUser(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await prisma.operatorProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.status(404).json({ error: 'Not found' });
    res.json(profile);
  } catch (e) { next(e); }
}
