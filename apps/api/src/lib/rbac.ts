import { prisma } from './prisma';

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });
  if (!user) return [];
  if (user.isSuperAdmin) return ['*'];
  const perms = new Set<string>();
  for (const ur of user.roles) {
    for (const rp of ur.role.permissions) perms.add(rp.permission.key);
  }
  return Array.from(perms);
}

export function requirePermission(permission: string) {
  return async (req: any, res: any, next: any) => {
    try {
      const perms = await getUserPermissions(req.userId);
      if (perms.includes('*') || perms.includes(permission)) return next();
      return res.status(403).json({ error: 'Forbidden' });
    } catch (e) {
      next(e);
    }
  };
}
