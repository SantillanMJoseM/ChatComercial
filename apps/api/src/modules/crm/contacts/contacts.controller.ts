import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { recordAudit } from '../../audit/audit.controller';

const schema = z.object({
  clientId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phones: z.array(z.string()).optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  jobTitle: z.string().optional(),
  isPrimary: z.boolean().optional(),
  preferences: z.any().optional(),
  isActive: z.boolean().optional(),
});

export async function listContacts(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.query.clientId as string | undefined;
    const where: any = { deletedAt: null };
    if (clientId) where.clientId = clientId;
    const items = await prisma.contact.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (e) { next(e); }
}

export async function createContact(req: Request, res: Response, next: NextFunction) {
  try {
    const body = schema.parse(req.body);
    if (body.isPrimary) await prisma.contact.updateMany({ where: { clientId: body.clientId }, data: { isPrimary: false } });
    const contact = await prisma.contact.create({ data: { ...body, email: body.email || undefined, phones: body.phones || [] } });
    recordAudit((req as any).userId, 'crm.contact.create', 'contact', contact.id, { clientId: body.clientId }, req.ip);
    res.status(201).json(contact);
  } catch (e) { next(e); }
}

export async function updateContact(req: Request, res: Response, next: NextFunction) {
  try {
    const body = schema.partial().parse(req.body);
    if (body.isPrimary && body.clientId) await prisma.contact.updateMany({ where: { clientId: body.clientId, id: { not: req.params.id } }, data: { isPrimary: false } });
    const contact = await prisma.contact.update({ where: { id: req.params.id }, data: body });
    res.json(contact);
  } catch (e) { next(e); }
}

export async function deleteContact(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.contact.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), isActive: false } });
    res.json({ ok: true });
  } catch (e) { next(e); }
}
