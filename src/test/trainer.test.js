// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/db';
import { seedDefaults } from '../db/seed';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedDefaults();
});

describe('trainer knowledge', () => {
  it('stores and retrieves rules', async () => {
    const id = crypto.randomUUID();
    await db.ai_knowledge_rules.put({ id, rule_prompt: 'No pongas punto final', category: 'tono', created_at: new Date().toISOString() });
    const rules = await db.ai_knowledge_rules.toArray();
    expect(rules.length).toBe(1);
    expect(rules[0].rule_prompt).toBe('No pongas punto final');
  });

  it('deletes rules', async () => {
    const id = crypto.randomUUID();
    await db.ai_knowledge_rules.put({ id, rule_prompt: 'test', category: 'general', created_at: new Date().toISOString() });
    await db.ai_knowledge_rules.delete(id);
    const rules = await db.ai_knowledge_rules.toArray();
    expect(rules.length).toBe(0);
  });
});