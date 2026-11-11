import { Worker, Queue } from 'bullmq';
import { prisma } from '../lib/prisma';
import IORedis from 'ioredis';
import fs from 'fs';
import crypto from 'crypto';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
export const documentQueue = new Queue('documents', { connection });

function extractText(mimeType: string, buffer: Buffer): { text: string; warnings: string[] } {
  const warnings: string[] = [];
  const mt = mimeType.toLowerCase();
  if (mt === 'text/plain' || mt === 'text/markdown' || mt === 'text/csv') {
    return { text: buffer.toString('utf8'), warnings };
  }
  if (mt === 'text/html') {
    const cheerio = require('cheerio');
    const $ = cheerio.load(buffer.toString('utf8'));
    $('script,style').remove();
    return { text: $('body').text().replace(/\s+/g, ' ').trim(), warnings };
  }
  if (mt === 'application/pdf') {
    const pdfParse = require('pdf-parse');
    // sync-ish: pdf-parse returns promise
    return { text: '__PDF_ASYNC__', warnings };
  }
  if (mt.includes('wordprocessingml')) {
    const mammoth = require('mammoth');
    return { text: '__DOCX_ASYNC__', warnings };
  }
  if (mt.includes('spreadsheetml') || mt === 'application/vnd.ms-excel') {
    return { text: '__XLSX_ASYNC__', warnings };
  }
  warnings.push('Unsupported mime, treating as text');
  return { text: buffer.toString('utf8'), warnings };
}

async function extractAsync(mimeType: string, buffer: Buffer): Promise<{ text: string; warnings: string[] }> {
  const warnings: string[] = [];
  const mt = mimeType.toLowerCase();
  if (mt === 'application/pdf') {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    const pages = data.numpages || 1;
    let text = '';
    // pdf-parse gives full text; add page markers not available per page, so use text
    text = data.text || '';
    if (!text.trim()) warnings.push('No text extracted (possible scanned PDF, OCR needed)');
    return { text, warnings };
  }
  if (mt.includes('wordprocessingml')) {
    const mammoth = require('mammoth');
    const r = await mammoth.extractRawText({ buffer });
    if (r.messages && r.messages.length) warnings.push(...r.messages.map((m: any) => m.message));
    return { text: r.value || '', warnings };
  }
  if (mt.includes('spreadsheetml') || mt === 'application/vnd.ms-excel') {
    const XLSX = require('xlsx');
    const wb = XLSX.read(buffer, { type: 'buffer' });
    let text = '';
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      text += `\n## Sheet: ${sheetName}\n`;
      for (const row of rows) {
        text += (row as any[]).join(' | ') + '\n';
      }
    }
    return { text, warnings };
  }
  if (mt === 'text/csv') {
    const { parse } = require('csv-parse/sync');
    const records = parse(buffer.toString('utf8'), { columns: true, skip_empty_lines: true });
    const text = records.map((r: any) => Object.entries(r).map(([k,v]) => `${k}: ${v}`).join(', ')).join('\n');
    return { text, warnings };
  }
  // html already handled sync
  const sync = extractText(mt, buffer);
  if (sync.text.startsWith('__')) {
    // fallback
  }
  return sync;
}

function chunkText(text: string, maxChars = 1000, overlap = 100): string[] {
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];
  const paragraphs = cleaned.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    if ((current.length + p.length + 2) <= maxChars) {
      current = current ? current + '\n\n' + p : p;
    } else {
      if (current) chunks.push(current);
      // if paragraph too long, split
      if (p.length > maxChars) {
        let i = 0;
        while (i < p.length) {
          chunks.push(p.slice(i, i + maxChars));
          i += maxChars - overlap;
        }
        current = '';
      } else {
        current = p;
      }
    }
  }
  if (current) chunks.push(current);
  // overlap: append tail of previous chunk to next
  const withOverlap: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (i > 0 && overlap > 0) {
      const prev = chunks[i-1];
      const tail = prev.slice(-overlap);
      withOverlap.push(tail + '\n' + chunks[i]);
    } else {
      withOverlap.push(chunks[i]);
    }
  }
  return withOverlap.filter((c) => c.trim().length > 0);
}

export function startDocumentWorker() {
  const worker = new Worker('documents', async (job) => {
    const jobId = job.data.jobId;
    const jobRec = await prisma.knowledgeProcessingJob.findUnique({ where: { id: jobId }, include: { version: { include: { document: true } } } });
    if (!jobRec) throw new Error('Job not found');
    if (jobRec.status === 'completed') return;
    await prisma.knowledgeProcessingJob.update({ where: { id: jobId }, data: { status: 'processing', startedAt: new Date(), step: 'extracting' } });

    const version = jobRec.version;
    const doc = version.document;
    const buffer = fs.readFileSync(version.storagePath);
    // size guard
    if (buffer.length > 50 * 1024 * 1024) throw new Error('File too large');

    const { text, warnings } = await extractAsync(doc.mimeType, buffer);

    await prisma.knowledgeProcessingJob.update({ where: { id: jobId }, data: { step: 'chunking' } });

    // idempotency: delete existing chunks for this version
    await prisma.knowledgeChunk.deleteMany({ where: { versionId: version.id } });

    const chunks = chunkText(text);
    let idx = 0;
    for (const c of chunks) {
      await prisma.knowledgeChunk.create({
        data: { versionId: version.id, chunkIndex: idx++, content: c, tokenCount: Math.ceil(c.length / 4), metadata: { warnings } },
      });
    }

    await prisma.knowledgeProcessingJob.update({
      where: { id: jobId },
      data: { status: 'completed', step: 'done', finishedAt: new Date(), attempts: { increment: 1 } },
    });
    await prisma.knowledgeDocumentVersion.update({ where: { id: version.id }, data: { status: 'completed', publishedAt: new Date() } });
    await prisma.knowledgeDocument.update({ where: { id: doc.id }, data: { status: 'processed' } });
  }, { connection, concurrency: 2 });

  worker.on('failed', async (job, err) => {
    if (job) {
      await prisma.knowledgeProcessingJob.update({ where: { id: job.data.jobId }, data: { status: 'failed', error: err.message, attempts: { increment: 1 }, finishedAt: new Date() } }).catch(() => {});
      const j = await prisma.knowledgeProcessingJob.findUnique({ where: { id: job.data.jobId } }).catch(() => null);
      if (j) await prisma.knowledgeDocumentVersion.update({ where: { id: j.versionId }, data: { status: 'failed', error: err.message } }).catch(() => {});
    }
  });
  return worker;
}

