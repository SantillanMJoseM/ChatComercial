import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { getUserPermissions } from '../../lib/rbac';

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  roleKeys: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  roleKeys: z.array(z.string()).optional(),
});

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { roles: { include: { role: true } } },
    });
    res.json(users.map((u) => ({
      id: u.id, email: u.email, name: u.name, isActive: u.isActive, isSuperAdmin: u.isSuperAdmin,
      createdAt: u.createdAt, roles: u.roles.map((r) => r.role.key),
    })));
  } catch (e) { next(e); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return res.status(409).json({ error: 'Email already exists' });
    // create via better-auth to hash password
    const { auth } = await import('../../lib/auth');
    const result = await auth.api.signUpEmail({ body: { email: body.email, password: body.password, name: body.name } });
    const userId = (result as any).user.id;
    // assign roles
    if (body.roleKeys && body.roleKeys.length) {
      const roles = await prisma.role.findMany({ where: { key: { in: body.roleKeys } } });
      for (const r of roles) {
        await prisma.userRole.create({ data: { userId, roleId: r.id } }).catch(() => {});
      }
    }
    if (body.isActive === false) {
      await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { roles: { include: { role: true } } } });
    res.status(201).json({ id: user!.id, email: user!.email, name: user!.name, isActive: user!.isActive, roles: user!.roles.map((r) => r.role.key) });
  } catch (e) { next(e); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const body = updateSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (body.name || body.isActive !== undefined) {
      await prisma.user.update({ where: { id }, data: { name: body.name, isActive: body.isActive } });
    }
    if (body.roleKeys) {
      await prisma.userRole.deleteMany({ where: { userId: id } });
      const roles = await prisma.role.findMany({ where: { key: { in: body.roleKeys } } });
      for (const r of roles) {
        await prisma.userRole.create({ data: { userId: id, roleId: r.id } }).catch(() => {});
      }
    }
    const updated = await prisma.user.findUnique({ where: { id }, include: { roles: { include: { role: true } } } });
    res.json({ id: updated!.id, email: updated!.email, name: updated!.name, isActive: updated!.isActive, roles: updated!.roles.map((r) => r.role.key) });
  } catch (e) { next(e); }
}
