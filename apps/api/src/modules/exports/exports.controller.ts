import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import fs from 'fs';
import path from 'path';
import { env } from '../../config/env';
import { recordAudit } from '../audit/audit.controller';

const storagePath = env.KNOWLEDGE_STORAGE_PATH || '/data/knowledge';
const exportDir = path.join(storagePath, 'exports');
fs.mkdirSync(exportDir, { recursive: true });

export async function exportReport(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ format: z.enum(['csv','xlsx','pdf']), type: z.string().default('overview') }).parse(req.body);
    // gather data
    const [totalClients, newClients, totalConvs, operators] = await Promise.all([
      prisma.client.count({ where: { deletedAt: null } }),
      prisma.client.count({ where: { deletedAt: null, createdAt: { gte: new Date(Date.now() - 30*24*60*60*1000) } } }),
      prisma.conversationReference.count(),
      prisma.operatorProfile.count(),
    ]);
    const rows = [
      ['Métrica', 'Valor'],
      ['Clientes totales', totalClients],
      ['Clientes nuevos (30d)', newClients],
      ['Conversaciones', totalConvs],
      ['Operadores', operators],
    ];
    const id = (req as any).userId + '-' + Date.now();
    const safeId = id.replace(/[^a-zA-Z0-9-]/g, '');
    if (body.format === 'csv') {
      const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const filePath = path.join(exportDir, `${safeId}.csv`);
      fs.writeFileSync(filePath, csv);
      recordAudit((req as any).userId, 'report.export', 'export', safeId, { format: 'csv' }, req.ip);
      res.download(filePath, 'report.csv');
      return;
    }
    if (body.format === 'xlsx') {
      const XLSX = require('xlsx');
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      const filePath = path.join(exportDir, `${safeId}.xlsx`);
      XLSX.writeFile(wb, filePath);
      recordAudit((req as any).userId, 'report.export', 'export', safeId, { format: 'xlsx' }, req.ip);
      res.download(filePath, 'report.xlsx');
      return;
    }
    if (body.format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const filePath = path.join(exportDir, `${safeId}.pdf`);
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      doc.fontSize(16).text('Reporte - Plataforma Integral de Atención Comercial', { align: 'center' });
      doc.moveDown();
      for (const r of rows) doc.fontSize(12).text(`${r[0]}: ${r[1]}`);
      doc.end();
      stream.on('finish', () => {
        recordAudit((req as any).userId, 'report.export', 'export', safeId, { format: 'pdf' }, req.ip);
        res.download(filePath, 'report.pdf');
      });
      return;
    }
  } catch (e) { next(e); }
}
