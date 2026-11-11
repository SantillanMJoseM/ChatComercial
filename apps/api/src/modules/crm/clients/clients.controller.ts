import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { recordAudit } from '../../audit/audit.controller';

const createSchema = z.object({
  name: z.string().min(1),
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  origin: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
});

const updateSchema = createSchema.partial();

function normalizePhone(p?: string) { return p ? p.replace(/\s+/g, '').replace(/[^\d+]/g, '') : undefined; }

export async function listClients(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || '';
    const status = req.query.status as string | undefined;
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const pageSize = Math.min(100, parseInt((req.query.pageSize as string) || '20'));
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { legalName: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { email: { contains: q, mode: 'insensitive' } }, { taxId: { contains: q } }];
    const [items, total] = await Promise.all([
      prisma.client.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page-1)*pageSize, take: pageSize, include: { owner: true, team: true } }),
      prisma.client.count({ where }),
    ]);
    res.json({ items, total, page, pageSize });
  } catch (e) { next(e); }
}

export async function getClient(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id }, include: { contacts: true, identities: true, clientNotes: { include: { author: true } }, interactions: { include: { actor: true } }, conversations: true, owner: true, team: true } });
    if (!client || client.deletedAt) return res.status(404).json({ error: 'Not found' });
    res.json(client);
  } catch (e) { next(e); }
}

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createSchema.parse(req.body);
    if (body.phone) body.phone = normalizePhone(body.phone);
    if (body.taxId) {
      const exists = await prisma.client.findUnique({ where: { taxId: body.taxId } });
      if (exists && !exists.deletedAt) return res.status(409).json({ error: 'Tax ID already exists' });
    }
    if (body.phone) {
      const exists = await prisma.client.findFirst({ where: { phone: body.phone, deletedAt: null } });
      if (exists) return res.status(409).json({ error: 'Phone already exists' });
    }
    const client = await prisma.client.create({ data: { ...body, email: body.email || undefined, tags: body.tags || [] } });
    recordAudit((req as any).userId, 'crm.client.create', 'client', client.id, { name: client.name }, req.ip);
    res.status(201).json(client);
  } catch (e) { next(e); }
}

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateSchema.parse(req.body);
    if (body.phone) body.phone = normalizePhone(body.phone);
    const client = await prisma.client.update({ where: { id: req.params.id }, data: body });
    recordAudit((req as any).userId, 'crm.client.update', 'client', client.id, body, req.ip);
    res.json(client);
  } catch (e) { next(e); }
}

export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.client.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), isActive: false, status: 'inactive' } });
    recordAudit((req as any).userId, 'crm.client.delete', 'client', req.params.id, undefined, req.ip);
    res.json({ ok: true });
  } catch (e) { next(e); }
}
