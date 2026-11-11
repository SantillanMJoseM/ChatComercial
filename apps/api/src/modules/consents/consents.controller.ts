import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

function normalizePhone(p: string) { return p.replace(/\s+/g,'').replace(/[^\d+]/g,''); }

export async function listConsents(req: Request, res: Response, next: NextFunction) {
  try {
    const phone = req.query.phone as string | undefined;
    const where: any = {};
    if (phone) where.phoneE164 = normalizePhone(phone);
    const items = await prisma.whatsAppConsent.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (e) { next(e); }
}

export async function createConsent(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({
      contactId: z.string().uuid().optional(),
      clientId: z.string().uuid().optional(),
      phoneE164: z.string().min(6),
      purpose: z.string().min(1),
      channel: z.string().optional(),
      status: z.enum(['granted','revoked']).default('granted'),
      source: z.string().optional(),
      evidenceReference: z.string().optional(),
    }).parse(req.body);
    const phone = normalizePhone(body.phoneE164);
    const consent = await prisma.whatsAppConsent.upsert({
      where: { phoneE164_purpose_channel: { phoneE164: phone, purpose: body.purpose, channel: body.channel || 'whatsapp' } },
      update: { status: body.status, contactId: body.contactId, clientId: body.clientId, source: body.source, evidenceReference: body.evidenceReference, revokedAt: body.status === 'revoked' ? new Date() : null },
      create: { contactId: body.contactId, clientId: body.clientId, phoneE164: phone, purpose: body.purpose, channel: body.channel || 'whatsapp', status: body.status, source: body.source, evidenceReference: body.evidenceReference, revokedAt: body.status === 'revoked' ? new Date() : null },
    });
    res.status(201).json(consent);
  } catch (e) { next(e); }
}

export async function revokeConsent(req: Request, res: Response, next: NextFunction) {
  try {
    const c = await prisma.whatsAppConsent.update({ where: { id: req.params.id }, data: { status: 'revoked', revokedAt: new Date() } });
    res.json(c);
  } catch (e) { next(e); }
}
