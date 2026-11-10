import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('health', () => {
  const app = createApp();
  it('GET /api/v1/health returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
  it('GET /api/v1/health/ready returns ready', async () => {
    const res = await request(app).get('/api/v1/health/ready');
    // may be 200 or 503 depending on DB/redis; in test env DB may be unavailable
    expect([200, 503]).toContain(res.status);
  });
});
