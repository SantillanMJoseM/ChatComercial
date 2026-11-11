import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { retrieve } from './retrieval.service';
import { recordAudit } from '../audit/audit.controller';

export async function retrieveEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ query: z.string().min(1), assistantKey: z.string().optional(), collectionIds: z.array(z.string().uuid()).optional(), topK: z.number().int().min(1).max(50).optional() }).parse(req.body);
    const result = await retrieve({ ...body, userId: (req as any).userId });
    recordAudit((req as any).userId, 'retrieval.query', 'retrieval', undefined, { query: body.query, results: result.results.length }, req.ip);
    res.json(result);
  } catch (e) { next(e); }
}
