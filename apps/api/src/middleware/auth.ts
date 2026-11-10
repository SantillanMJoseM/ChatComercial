import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export interface AuthedRequest extends Request {
  userId?: string;
  user?: any;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const session = await prisma.session.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }
    req.userId = session.userId;
    next();
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
