import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export async function listPermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const perms = await prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { key: 'asc' }] });
    res.json(perms.map((p) => ({ id: p.id, key: p.key, name: p.name, description: p.description, module: p.module })));
  } catch (e) { next(e); }
}
