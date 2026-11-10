import { auth } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

export async function login(email: string, password: string, headers: any) {
  const result = await auth.api.signInEmail({
    body: { email, password },
    headers,
  });
  return result;
}

export async function logout(headers: any) {
  return auth.api.signOut({ headers });
}

export async function getSession(headers: any) {
  return auth.api.getSession({ headers });
}

export async function getUserWithRoles(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      teamMembers: { include: { team: true } },
    },
  });
  if (!user) return null;
  const roles = user.roles.map((ur) => ur.role.key);
  const permissions = Array.from(new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))));
  const teams = user.teamMembers.map((tm) => ({ id: tm.team.id, name: tm.team.name, role: tm.role }));
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    isSuperAdmin: user.isSuperAdmin,
    roles,
    permissions,
    teams,
  };
}
