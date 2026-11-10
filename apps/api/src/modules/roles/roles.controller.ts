import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export async function listRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await prisma.role.findMany({ include: { permissions: { include: { permission: true } } }, orderBy: { key: 'asc' } });
    res.json(roles.map((r) => ({
      id: r.id, key: r.key, name: r.name, description: r.description, isSystem: r.isSystem,
      permissions: r.permissions.map((p) => p.permission.key),
    })));
  } catch (e) { next(e); }
}
