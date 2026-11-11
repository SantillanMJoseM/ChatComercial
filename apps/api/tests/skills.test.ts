import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { auth } from '../src/lib/auth';

describe('skills', () => {
  const app = createApp();
  let adminToken = '';
  let operatorToken = '';

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { key: 'admin' } });
    const perms = await prisma.permission.findMany();
    for (const p of perms) await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role!.id, permissionId: p.id } }, update: {}, create: { roleId: role!.id, permissionId: p.id } });
    // admin user
    const existing = await prisma.user.findUnique({ where: { email: 'skilladmin@cap.local' } });
    if (!existing) {
      const r = await auth.api.signUpEmail({ body: { email: 'skilladmin@cap.local', password: 'Test1234!', name: 'Skill Admin' } });
      const uid = (r as any).user.id;
      await prisma.user.update({ where: { id: uid }, data: { isSuperAdmin: true } });
      await prisma.userRole.create({ data: { userId: uid, roleId: role!.id } }).catch(() => {});
    }
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'skilladmin@cap.local', password: 'Test1234!' });
    adminToken = login.body.token;

    // operator user
    const opRole = await prisma.role.findUnique({ where: { key: 'operator' } });
    const opExisting = await prisma.user.findUnique({ where: { email: 'skillop@cap.local' } });
    if (!opExisting) {
      const r = await auth.api.signUpEmail({ body: { email: 'skillop@cap.local', password: 'Test1234!', name: 'Skill Op' } });
      const uid = (r as any).user.id;
      await prisma.userRole.create({ data: { userId: uid, roleId: opRole!.id } }).catch(() => {});
    }
    const opLogin = await request(app).post('/api/v1/auth/login').send({ email: 'skillop@cap.local', password: 'Test1234!' });
    operatorToken = opLogin.body.token;
  });

  it('create skill (draft, disabled)', async () => {
    const r = await request(app).post('/api/v1/skills').set('Authorization', `Bearer ${adminToken}`).send({ key: 'test-skill-' + Date.now(), name: 'Test Skill' });
    expect(r.status).toBe(201);
    expect(r.body.status).toBe('draft');
    expect(r.body.executionMode).toBe('disabled');
  });

  it('operator cannot create skill', async () => {
    const r = await request(app).post('/api/v1/skills').set('Authorization', `Bearer ${operatorToken}`).send({ key: 'x', name: 'X' });
    expect(r.status).toBe(403);
  });

  it('create version', async () => {
    const key = 'ver-skill-' + Date.now();
    await request(app).post('/api/v1/skills').set('Authorization', `Bearer ${adminToken}`).send({ key, name: 'Ver Skill' });
    const r = await request(app).post(`/api/v1/skills/${key}/versions`).set('Authorization', `Bearer ${adminToken}`).send({ version: 1, instructions: 'Do something.' });
    expect(r.status).toBe(201);
    expect(r.body.status).toBe('draft');
  });

  it('publish version activates skill', async () => {
    const key = 'pub-skill-' + Date.now();
    await request(app).post('/api/v1/skills').set('Authorization', `Bearer ${adminToken}`).send({ key, name: 'Pub Skill' });
    const v = await request(app).post(`/api/v1/skills/${key}/versions`).set('Authorization', `Bearer ${adminToken}`).send({ version: 1, instructions: 'Instr.' });
    const pub = await request(app).post(`/api/v1/skills/${key}/publish`).set('Authorization', `Bearer ${adminToken}`).send({ versionId: v.body.id });
    expect(pub.status).toBe(200);
    const skill = await request(app).get(`/api/v1/skills/${key}`).set('Authorization', `Bearer ${adminToken}`);
    expect(skill.body.status).toBe('published');
    expect(skill.body.publishedVersionId).toBe(v.body.id);
  });

  it('execute disabled skill fails', async () => {
    const key = 'dis-skill-' + Date.now();
    await request(app).post('/api/v1/skills').set('Authorization', `Bearer ${adminToken}`).send({ key, name: 'Dis Skill' });
    const r = await request(app).post(`/api/v1/skills/${key}/execute`).set('Authorization', `Bearer ${adminToken}`).send({ input: {} });
    expect(r.status).not.toBe(200);
  });

  it('execute published skill in assist mode requires approval', async () => {
    const key = 'assist-skill-' + Date.now();
    await request(app).post('/api/v1/skills').set('Authorization', `Bearer ${adminToken}`).send({ key, name: 'Assist Skill' });
    const v = await request(app).post(`/api/v1/skills/${key}/versions`).set('Authorization', `Bearer ${adminToken}`).send({ version: 1, instructions: 'Instr.' });
    await request(app).post(`/api/v1/skills/${key}/publish`).set('Authorization', `Bearer ${adminToken}`).send({ versionId: v.body.id });
    await request(app).patch(`/api/v1/skills/${key}`).set('Authorization', `Bearer ${adminToken}`).send({ executionMode: 'assist' });
    const r = await request(app).post(`/api/v1/skills/${key}/execute`).set('Authorization', `Bearer ${adminToken}`).send({ input: { x: 1 } });
    expect(r.status).toBe(202);
    expect(r.body.status).toBe('awaiting_approval');
  });

  it('idempotency: same key same payload replays', async () => {
    const key = 'idem-skill-' + Date.now();
    await request(app).post('/api/v1/skills').set('Authorization', `Bearer ${adminToken}`).send({ key, name: 'Idem Skill' });
    const v = await request(app).post(`/api/v1/skills/${key}/versions`).set('Authorization', `Bearer ${adminToken}`).send({ version: 1, instructions: 'Instr.' });
    await request(app).post(`/api/v1/skills/${key}/publish`).set('Authorization', `Bearer ${adminToken}`).send({ versionId: v.body.id });
    await request(app).patch(`/api/v1/skills/${key}`).set('Authorization', `Bearer ${adminToken}`).send({ executionMode: 'auto' });
    const ik = 'idem-key-' + Date.now();
    const r1 = await request(app).post(`/api/v1/skills/${key}/execute`).set('Authorization', `Bearer ${adminToken}`).send({ input: { a: 1 }, idempotencyKey: ik });
    const r2 = await request(app).post(`/api/v1/skills/${key}/execute`).set('Authorization', `Bearer ${adminToken}`).send({ input: { a: 1 }, idempotencyKey: ik });
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r2.body.replayed).toBe(true);
    expect(r2.body.executionId).toBe(r1.body.executionId);
  });

  it('idempotency: same key different payload -> 409', async () => {
    const key = 'idem2-skill-' + Date.now();
    await request(app).post('/api/v1/skills').set('Authorization', `Bearer ${adminToken}`).send({ key, name: 'Idem2 Skill' });
    const v = await request(app).post(`/api/v1/skills/${key}/versions`).set('Authorization', `Bearer ${adminToken}`).send({ version: 1, instructions: 'Instr.' });
    await request(app).post(`/api/v1/skills/${key}/publish`).set('Authorization', `Bearer ${adminToken}`).send({ versionId: v.body.id });
    await request(app).patch(`/api/v1/skills/${key}`).set('Authorization', `Bearer ${adminToken}`).send({ executionMode: 'auto' });
    const ik = 'idem-key2-' + Date.now();
    await request(app).post(`/api/v1/skills/${key}/execute`).set('Authorization', `Bearer ${adminToken}`).send({ input: { a: 1 }, idempotencyKey: ik });
    const r2 = await request(app).post(`/api/v1/skills/${key}/execute`).set('Authorization', `Bearer ${adminToken}`).send({ input: { a: 2 }, idempotencyKey: ik });
    expect(r2.status).toBe(409);
  });

  it('list executions', async () => {
    const r = await request(app).get('/api/v1/skill-executions').set('Authorization', `Bearer ${adminToken}`);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });
});
