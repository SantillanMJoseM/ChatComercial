import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { embeddingsQueue } from '../../workers/embeddings.worker';
import { getEmbeddingConfig, setEmbeddingConfig, generateEmbeddings } from './embeddings.service';
import { recordAudit } from '../audit/audit.controller';

export async function getConfig(req: Request, res: Response, next: NextFunction) {
  try { res.json(await getEmbeddingConfig()); } catch (e) { next(e); }
}

export async function setConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ providerKey: z.string(), modelId: z.string().uuid(), dimension: z.number().int(), metric: z.string().default('cosine'), batchSize: z.number().int().default(100) }).parse(req.body);
    await setEmbeddingConfig(body);
    recordAudit((req as any).userId, 'embedding.config.set', 'embedding_config', body.modelId, body, req.ip);
    res.json(body);
  } catch (e) { next(e); }
}

export async function testConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ providerKey: z.string(), modelId: z.string().uuid() }).parse(req.body);
    const { dimension } = await generateEmbeddings(body.providerKey, body.modelId, ['test']);
    res.json({ ok: true, dimension });
  } catch (e: any) { res.status(502).json({ ok: false, error: e.message }); }
}

export async function indexDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ versionId: z.string().uuid().optional(), collectionId: z.string().uuid().optional() }).parse(req.body);
    const job = await embeddingsQueue.add('index', body, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    res.status(202).json({ jobId: job.id });
  } catch (e) { next(e); }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ query: z.string().min(1), limit: z.number().int().default(5), collectionId: z.string().uuid().optional() }).parse(req.body);
    const cfg = await getEmbeddingConfig();
    if (!cfg) return res.status(400).json({ error: 'Embedding config not set' });
    const { vectors } = await generateEmbeddings(cfg.providerKey, cfg.modelId, [body.query]);
    const qv = vectors[0];
    // raw SQL similarity search
    const collectionFilter = body.collectionId ? `AND kd."collectionId" = '${body.collectionId}'` : '';
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT kc.id, kc.content, kc."versionId", ke.dimension,
              (ke.vector::vector(${cfg.dimension}) <=> $1::vector(${cfg.dimension})) AS distance
       FROM "KnowledgeEmbedding" ke
       JOIN "KnowledgeChunk" kc ON kc.id = ke."chunkId"
       JOIN "KnowledgeDocumentVersion" dv ON dv.id = kc."versionId"
       JOIN "KnowledgeDocument" kd ON kd.id = dv."documentId"
       WHERE ke.dimension = $2 AND ke."modelId" = $3::uuid
       ${collectionFilter}
       ORDER BY ke.vector::vector(${cfg.dimension}) <=> $1::vector(${cfg.dimension})
       LIMIT $4`,
      `[${qv.join(',')}]`, cfg.dimension, cfg.modelId, body.limit
    );
    res.json(rows);
  } catch (e) { next(e); }
}

export async function getStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const totalChunks = await prisma.knowledgeChunk.count();
    const totalEmbeddings = await prisma.knowledgeEmbedding.count();
    res.json({ totalChunks, totalEmbeddings });
  } catch (e) { next(e); }
}
