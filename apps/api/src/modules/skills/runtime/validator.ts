import { z } from 'zod';

export function validateParams(schema: any, input: any) {
  if (!schema) return { ok: true, data: input };
  try {
    const parsed = z.object(schema).parse(input || {});
    return { ok: true, data: parsed };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
