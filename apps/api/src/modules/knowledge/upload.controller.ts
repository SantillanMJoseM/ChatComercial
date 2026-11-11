import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { documentQueue } from '../../workers/document.worker';
import { env } from '../../config/env';
import { recordAudit } from '../audit/audit.controller';

const storagePath = env.KNOWLEDGE_STORAGE_PATH || '/data/knowledge';
fs.mkdirSync(storagePath, { recursive: true });
fs.mkdirSync(path.join(storagePath, 'originals'), { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

export const uploadMiddleware = upload.single('file');

const ALLOWED_MIME = new Set(['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','text/plain','text/markdown','text/html']);

export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: 'No file' });
    const collectionId = z.string().uuid().parse(req.body.collectionId);
    const description = req.body.description as string | undefined;

    // validate mime
    if (!ALLOWED_MIME.has(file.mimetype)) return res.status(415).json({ error: 'Unsupported MIME type' });

    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    // duplicate check
    const exists = await prisma.knowledgeDocument.findUnique({ where: { collectionId_hash: { collectionId, hash } } });
    if (exists) return res.status(409).json({ error: 'Duplicate document (same hash)', documentId: exists.id });

    // store file
    const id = crypto.randomUUID();
    const ext = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '');
    const safeName = id + ext;
    const destDir = path.join(storagePath, 'originals');
    const destPath = path.join(destDir, safeName);
    // path traversal guard
    if (!destPath.startsWith(destDir)) return res.status(400).json({ error: 'Invalid path' });
    fs.writeFileSync(destPath, file.buffer);

    const doc = await prisma.knowledgeDocument.create({
      data: { collectionId, name: file.originalname, description, mimeType: file.mimetype, sizeBytes: file.size, storagePath: destPath, hash, createdBy: (req as any).userId },
    });
    // create version 1
    const ver = await prisma.knowledgeDocumentVersion.create({
      data: { documentId: doc.id, version: 1, storagePath: destPath, hash, status: 'pending', publishedAt: new Date() },
    });
    await prisma.knowledgeDocument.update({ where: { id: doc.id }, data: { currentVersionId: ver.id } });
    const job = await prisma.knowledgeProcessingJob.create({ data: { versionId: ver.id, status: 'queued' } });
    await documentQueue.add('process', { jobId: job.id }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });

    recordAudit((req as any).userId, 'knowledge.document.upload', 'knowledge_document', doc.id, { name: doc.name, hash }, req.ip);
    res.status(201).json({ document: doc, version: ver });
  } catch (e) { next(e); }
}

export async function downloadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await prisma.knowledgeDocument.findUnique({ where: { id: req.params.id } });
    if (!doc || doc.deletedAt) return res.status(404).json({ error: 'Not found' });
    if (!fs.existsSync(doc.storagePath)) return res.status(404).json({ error: 'File not found' });
    res.download(doc.storagePath, doc.name);
  } catch (e) { next(e); }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.knowledgeDocument.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), status: 'deleted' } });
    recordAudit((req as any).userId, 'knowledge.document.delete', 'knowledge_document', req.params.id, undefined, req.ip);
    res.json({ ok: true });
  } catch (e) { next(e); }
}
