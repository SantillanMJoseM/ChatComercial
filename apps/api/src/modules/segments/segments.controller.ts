import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../audit/audit.controller';

const filterSchema = z.object({
  field: z.enum(['status','origin','teamId','ownerId','tags','createdAtFrom','createdAtTo','lastInteractionFrom','lastInteractionTo','phone','email','name']),
  op: z.enum(['eq','ne','contains','in','gte','lte']).default('eq'),
  value: z.any(),
});
const criteriaSchema = z.object({
  combine: z.enum(['and','or']).default('and'),
  filters: z.array(filterSchema).default([]),
});

function buildWhere(criteria: any) {
  const filters = criteria.filters || [];
  const conditions: any[] = [];
  for (const f of filters) {
    switch (f.field) {
      case 'status': conditions.push({ status: f.op === 'ne' ? { not: f.value } : f.value }); break;
      case 'origin': conditions.push({ origin: f.op === 'contains' ? { contains: f.value, mode: 'insensitive' } : f.value }); break;
      case 'teamId': conditions.push({ teamId: f.value }); break;
      case 'ownerId': conditions.push({ ownerId: f.value }); break;
      case 'tags': conditions.push({ tags: { has: f.value } }); break;
      case 'createdAtFrom': conditions.push({ createdAt: { gte: new Date(f.value) } }); break;
      case 'createdAtTo': conditions.push({ createdAt: { lte: new Date(f.value) } }); break;
      case 'lastInteractionFrom': conditions.push({ lastInteractionAt: { gte: new Date(f.value) } }); break;
      case 'lastInteractionTo': conditions.push({ lastInteractionAt: { lte: new Date(f.value) } }); break;
      case 'phone': conditions.push({ phone: { contains: f.value } }); break;
      case 'email': conditions.push({ email: { contains: f.value, mode: 'insensitive' } }); break;
      case 'name': conditions.push({ name: { contains: f.value, mode: 'insensitive' } }); break;
    }
  }
  const where: any = { deletedAt: null };
  if (conditions.length) {
    where[criteria.combine === 'or' ? 'OR' : 'AND'] = conditions;
  }
  return where;
}

export async function listSegments(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.segment.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (e) { next(e); }
}

export async function createSegment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ name: z.string().min(1), description: z.string().optional(), criteria: criteriaSchema, isDynamic: z.boolean().optional() }).parse(req.body);
    const seg = await prisma.segment.create({ data: { name: body.name, description: body.description, criteria: body.criteria, isDynamic: body.isDynamic ?? true, createdBy: (req as any).userId } });
    recordAudit((req as any).userId, 'segment.create', 'segment', seg.id, { name: seg.name }, req.ip);
    res.status(201).json(seg);
  } catch (e) { next(e); }
}

export async function getSegment(req: Request, res: Response, next: NextFunction) {
  try {
    const seg = await prisma.segment.findUnique({ where: { id: req.params.id } });
    if (!seg) return res.status(404).json({ error: 'Not found' });
    res.json(seg);
  } catch (e) { next(e); }
}

export async function previewSegment(req: Request, res: Response, next: NextFunction) {
  try {
    const seg = await prisma.segment.findUnique({ where: { id: req.params.id } });
    if (!seg) return res.status(404).json({ error: 'Not found' });
    const criteria = criteriaSchema.parse(seg.criteria);
    const where = buildWhere(criteria);
    const clients = await prisma.client.findMany({ where, select: { id: true, name: true, phone: true, email: true, status: true, teamId: true, ownerId: true } });
    res.json({ count: clients.length, clients });
  } catch (e) { next(e); }
}

export async function deleteSegment(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.segment.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export { buildWhere, criteriaSchema };
