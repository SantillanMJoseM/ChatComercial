// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateBotReply, shouldCloseConversation, isOutOfHours } from '../utils/ai';

describe('ai tone and behavior', () => {
  const settings = { outOfHours: false, toneRules: { noOpeningQuestionMark: true, noFinalPeriod: true, useDiscreteEmojis: true }, weeklySchedule: {} };

  it('does not use opening question mark', () => {
    const reply = generateBotReply({ text: 'hola', messages: [], rules: [], settings, customer: { name: 'Ana' }, products: [] });
    expect(reply).not.toContain('¿');
  });

  it('does not end with final period', () => {
    const reply = generateBotReply({ text: 'hola', messages: [], rules: [], settings, customer: null, products: [] });
    expect(reply.endsWith('.')).toBe(false);
  });

  it('closes conversation on gratitude', () => {
    expect(shouldCloseConversation('gracias')).toBe(true);
    expect(shouldCloseConversation('ok')).toBe(true);
  });

  it('returns null for gratitude message', () => {
    const reply = generateBotReply({ text: 'gracias', messages: [], rules: [], settings, customer: null, products: [] });
    expect(reply).toBeNull();
  });

  it('uses knowledge rules in price reply', () => {
    const rules = [{ id: '1', rule_prompt: 'Las ventanas Módena subieron un 10%', category: 'precios', created_at: new Date().toISOString() }];
    const reply = generateBotReply({ text: 'precio ventana', messages: [], rules, settings, customer: null, products: [{ name: 'Ventana', price: 100 }] });
    expect(reply).toContain('subieron un 10%');
  });
});