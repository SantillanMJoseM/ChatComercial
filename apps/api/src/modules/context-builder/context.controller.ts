import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { retrieve } from '../retrieval/retrieval.service';
import { buildContext, contextConfigSchema } from './context.service';
import { recordAudit } from '../audit/audit.controller';

export async function buildContextEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({
      query: z.string().min(1),
      assistantKey: z.string().optional(),
      collectionIds: z.array(z.string().uuid()).optional(),
      topK: z.number().int().optional(),
      config: contextConfigSchema.optional(),
    }).parse(req.body);
    const retrieval = await retrieve({ query: body.query, assistantKey: body.assistantKey, collectionIds: body.collectionIds, topK: body.topK, userId: (req as any).userId });
    const cfg = body.config || { maxTokens: 2000, maxChunks: 5, maxPerDocument: 2, minScore: 0, includeNeighbors: false };
    const ctx = await buildContext(undefined, body.assistantKey, retrieval.results, cfg);
    recordAudit((req as any).userId, 'context.build', 'context', ctx.contextId, { query: body.query, sources: ctx.sources.length }, req.ip);
    res.json(ctx);
  } catch (e) { next(e); }
}
