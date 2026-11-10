import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { auth } from '../src/lib/auth';

describe('auth', () => {
  const app = createApp();
  beforeAll(async () => {
    // ensure admin role + user
    const role = await prisma.role.upsert({ where: { key: 'admin' }, update: {}, create: { key: 'admin', name: 'Administrator', isSystem: true } });
    const perms = await prisma.permission.findMany();
    for (const p of perms) {
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } }, update: {}, create: { roleId: role.id, permissionId: p.id } });
    }
    const existing = await prisma.user.findUnique({ where: { email: 'test@cap.local' } });
    if (!existing) {
      const r = await auth.api.signUpEmail({ body: { email: 'test@cap.local', password: 'Test1234!', name: 'Tester' } });
      const uid = (r as any).user.id;
      await prisma.user.update({ where: { id: uid }, data: { isSuperAdmin: true } });
      await prisma.userRole.create({ data: { userId: uid, roleId: role.id } }).catch(() => {});
    }
  });

  it('login succeeds', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@cap.local', password: 'Test1234!' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@cap.local');
  });

  it('me requires auth', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('me returns user with cookie', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'test@cap.local', password: 'Test1234!' });
    const cookie = login.headers['set-cookie'];
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@cap.local');
  });
});
