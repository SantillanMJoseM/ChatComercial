import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auth } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { getUserPermissions } from '../../lib/rbac';
import { recordAudit } from '../audit/audit.controller';

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1) });

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await auth.api.signInEmail({ body: { email: body.email, password: body.password } });
    const token = (result as any).token;
    res.cookie('session_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    const user = await prisma.user.findUnique({ where: { id: (result as any).user.id } });
    const permissions = user ? await getUserPermissions(user.id) : [];
    recordAudit(user?.id ?? null, 'auth.login', 'session', undefined, { email: body.email }, req.ip);
    res.json({
      user: { ...(result as any).user, permissions },
      token,
    });
  } catch (e) {
    next(e);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await auth.api.signUpEmail({ body: { email: body.email, password: body.password, name: body.name } });
    const token = (result as any).token;
    res.cookie('session_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.status(201).json({ user: (result as any).user, token });
  } catch (e) {
    next(e);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (token) {
      try { await auth.api.signOut({ headers: { cookie: `better-auth.session_token=${token}` } }); } catch {}
      await prisma.session.deleteMany({ where: { token } }).catch(() => {});
    }
    recordAudit((req as any).userId ?? null, 'auth.logout', 'session', undefined, undefined, req.ip);
    res.clearCookie('session_token', { path: '/' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function me(req: any, res: Response, next: NextFunction) {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const permissions = await getUserPermissions(user.id);
    const roles = await prisma.userRole.findMany({ where: { userId: user.id }, include: { role: true } });
    const teams = await prisma.teamMember.findMany({ where: { userId: user.id }, include: { team: true } });
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      isSuperAdmin: user.isSuperAdmin,
      roles: roles.map((r) => r.role.key),
      permissions,
      teams: teams.map((t) => ({ id: t.team.id, name: t.team.name, role: t.role })),
    });
  } catch (e) {
    next(e);
  }
}

function extractToken(req: Request): string | null {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/(?:^|;\s*)session_token=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);
  const authz = req.headers.authorization;
  if (authz && authz.startsWith('Bearer ')) return authz.slice(7);
  return null;
}
