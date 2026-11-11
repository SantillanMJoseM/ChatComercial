import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { documentQueue } from '../../workers/document.worker';
import { recordAudit } from '../audit/audit.controller';

export async function listCollections(req: Request, res: Response, next: NextFunction) {
  try { res.json(await prisma.knowledgeCollection.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } })); } catch (e) { next(e); }
}
export async function createCollection(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ name: z.string().min(1), description: z.string().optional(), isPublic: z.boolean().optional() }).parse(req.body);
    const c = await prisma.knowledgeCollection.create({ data: { ...body, createdBy: (req as any).userId } });
    recordAudit((req as any).userId, 'knowledge.collection.create', 'knowledge_collection', c.id, { name: c.name }, req.ip);
    res.status(201).json(c);
  } catch (e) { next(e); }
}
export async function listDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const collectionId = req.query.collectionId as string | undefined;
    const where: any = { deletedAt: null };
    if (collectionId) where.collectionId = collectionId;
    res.json(await prisma.knowledgeDocument.findMany({ where, orderBy: { createdAt: 'desc' } }));
  } catch (e) { next(e); }
}
export async function createDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ collectionId: z.string().uuid(), name: z.string().min(1), mimeType: z.string(), sizeBytes: z.number().int(), storagePath: z.string(), hash: z.string() }).parse(req.body);
    const exists = await prisma.knowledgeDocument.findUnique({ where: { collectionId_hash: { collectionId: body.collectionId, hash: body.hash } } });
    if (exists) return res.status(409).json({ error: 'Duplicate document' });
    const d = await prisma.knowledgeDocument.create({ data: { ...body, createdBy: (req as any).userId } });
    recordAudit((req as any).userId, 'knowledge.document.create', 'knowledge_document', d.id, { name: d.name }, req.ip);
    res.status(201).json(d);
  } catch (e) { next(e); }
}
export async function listJobs(req: Request, res: Response, next: NextFunction) {
  try { res.json(await prisma.knowledgeProcessingJob.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })); } catch (e) { next(e); }
}
export async function createJob(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ versionId: z.string().uuid() }).parse(req.body);
    const j = await prisma.knowledgeProcessingJob.create({ data: { versionId: body.versionId, status: 'queued' } });
    await documentQueue.add('process', { jobId: j.id }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    res.status(201).json(j);
  } catch (e) { next(e); }
}

export async function listChunks(req: Request, res: Response, next: NextFunction) {
  try {
    const versionId = req.query.versionId as string;
    const items = await prisma.knowledgeChunk.findMany({ where: versionId ? { versionId } : undefined, orderBy: { chunkIndex: 'asc' }, take: 200 });
    res.json(items);
  } catch (e) { next(e); }
}
