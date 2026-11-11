import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../audit/audit.controller';

export async function listSkills(req: Request, res: Response, next: NextFunction) {
  try { res.json(await prisma.skill.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' }, include: { versions: true } })); } catch (e) { next(e); }
}
export async function createSkill(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ key: z.string().min(1), name: z.string().min(1), description: z.string().optional() }).parse(req.body);
    const s = await prisma.skill.create({ data: body });
    recordAudit((req as any).userId, 'skill.create', 'skill', s.key, { name: s.name }, req.ip);
    res.status(201).json(s);
  } catch (e) { next(e); }
}
export async function createSkillVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ skillId: z.string().uuid(), version: z.number().int(), instructions: z.string().min(1), parameters: z.any().optional() }).parse(req.body);
    const v = await prisma.skillVersion.create({ data: { ...body, createdBy: (req as any).userId } });
    res.status(201).json(v);
  } catch (e) { next(e); }
}
export async function listSkillVersions(req: Request, res: Response, next: NextFunction) {
  try { res.json(await prisma.skillVersion.findMany({ where: { skillId: req.params.skillId }, orderBy: { version: 'desc' } })); } catch (e) { next(e); }
}
