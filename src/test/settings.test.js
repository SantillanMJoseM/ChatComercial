// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/db';
import { seedDefaults } from '../db/seed';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedDefaults();
});

describe('settings persistence', () => {
  it('seeds default settings', async () => {
    const s = await db.settings.get('global');
    expect(s).toBeTruthy();
    expect(s.botResponseMode).toBe('auto');
    expect(s.outOfHours).toBe(false);
  });

  it('persists updates', async () => {
    const current = await db.settings.get('global');
    const next = { ...current, outOfHours: true, botResponseMode: 'manual' };
    await db.settings.put(next);
    const reloaded = await db.settings.get('global');
    expect(reloaded.outOfHours).toBe(true);
    expect(reloaded.botResponseMode).toBe('manual');
  });

  it('persists tone rules', async () => {
    const current = await db.settings.get('global');
    const next = { ...current, toneRules: { ...current.toneRules, noFinalPeriod: false } };
    await db.settings.put(next);
    const reloaded = await db.settings.get('global');
    expect(reloaded.toneRules.noFinalPeriod).toBe(false);
  });

  it('persists weekly schedule', async () => {
    const current = await db.settings.get('global');
    const weeklySchedule = { ...current.weeklySchedule, sunday: { enabled: true, start: '10:00', end: '14:00' } };
    await db.settings.put({ ...current, weeklySchedule });
    const reloaded = await db.settings.get('global');
    expect(reloaded.weeklySchedule.sunday.enabled).toBe(true);
    expect(reloaded.weeklySchedule.sunday.start).toBe('10:00');
  });
});