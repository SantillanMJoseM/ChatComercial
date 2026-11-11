import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { auth } from '../src/lib/auth';

describe('crm', () => {
  const app = createApp();
  let adminToken = '';
  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { key: 'admin' } });
    const perms = await prisma.permission.findMany();
    for (const p of perms) await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role!.id, permissionId: p.id } }, update: {}, create: { roleId: role!.id, permissionId: p.id } });
    const existing = await prisma.user.findUnique({ where: { email: 'crmtest@cap.local' } });
    if (!existing) {
      const r = await auth.api.signUpEmail({ body: { email: 'crmtest@cap.local', password: 'Test1234!', name: 'CRM Tester' } });
      const uid = (r as any).user.id;
      await prisma.user.update({ where: { id: uid }, data: { isSuperAdmin: true } });
      await prisma.userRole.create({ data: { userId: uid, roleId: role!.id } }).catch(() => {});
    }
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'crmtest@cap.local', password: 'Test1234!' });
    adminToken = login.body.token;
    const cookie = login.headers['set-cookie'];
    // store cookie globally via closure not needed; use token in header
  });

  it('create and list client', async () => {
    const c = await request(app).post('/api/v1/clients').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Test Client', phone: '+54911'+Date.now(), taxId: '20-00000000-'+Date.now() });
    expect(c.status).toBe(201);
    const list = await request(app).get('/api/v1/clients').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.items.length).toBeGreaterThan(0);
  });

  it('duplicate taxId rejected', async () => {
    const tax = '20-DUP-'+Date.now();
    await request(app).post('/api/v1/clients').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Dup1', taxId: tax });
    const c = await request(app).post('/api/v1/clients').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Dup2', taxId: tax });
    expect(c.status).toBe(409);
  });

  it('rbac: operator cannot create client', async () => {
    // create operator user if not exists
    const op = await prisma.user.findUnique({ where: { email: 'optest@cap.local' } });
    if (!op) {
      const r = await auth.api.signUpEmail({ body: { email: 'optest@cap.local', password: 'Test1234!', name: 'Op' } });
      const uid = (r as any).user.id;
      const role = await prisma.role.findUnique({ where: { key: 'operator' } });
      await prisma.userRole.create({ data: { userId: uid, roleId: role!.id } }).catch(() => {});
    }
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'optest@cap.local', password: 'Test1234!' });
    const tok = login.body.token;
    const res = await request(app).post('/api/v1/clients').set('Authorization', `Bearer ${tok}`).send({ name: 'X' });
    expect(res.status).toBe(403);
  });

  it('metrics endpoint', async () => {
    const res = await request(app).get('/api/v1/metrics').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.clients.total).toBeGreaterThanOrEqual(1);
  });
});
