import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { generateGrounded } from './grounded.service';
import { recordAudit } from '../audit/audit.controller';

export async function groundedExecute(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ assistantKey: z.string(), query: z.string().min(1), collectionIds: z.array(z.string().uuid()).optional(), topK: z.number().int().optional() }).parse(req.body);
    const result = await generateGrounded(body.assistantKey, body.query, (req as any).userId, body.collectionIds, body.topK);
    recordAudit((req as any).userId, 'grounded.execute', 'grounded_generation', result.generationId, { status: result.status, grounded: result.grounded }, req.ip);
    res.json(result);
  } catch (e) { next(e); }
}
