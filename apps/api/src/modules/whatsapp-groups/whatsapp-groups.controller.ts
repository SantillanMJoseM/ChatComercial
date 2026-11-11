import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { createWahaAdapter } from '../../adapters/waha';
import { recordAudit } from '../audit/audit.controller';

function normalizePhone(p: string) { return p.replace(/\s+/g,'').replace(/[^\d+]/g,''); }

async function wahaSessionConnected(session: string): Promise<boolean> {
  try {
    const a = createWahaAdapter();
    const s = await a.getSession(session);
    return s?.status === 'WORKING' || s?.status === 'CONNECTED';
  } catch { return false; }
}

export async function listGroups(req: Request, res: Response, next: NextFunction) {
  try {
    const groups = await prisma.whatsAppGroup.findMany({ orderBy: { createdAt: 'desc' }, include: { members: true, segment: true } });
    res.json(groups);
  } catch (e) { next(e); }
}

export async function previewGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ session: z.string().default('default'), segmentId: z.string().uuid().optional(), phones: z.array(z.string()).optional() }).parse(req.body);
    const connected = await wahaSessionConnected(body.session);
    // gather phones
    let phones: string[] = body.phones || [];
    if (body.segmentId) {
      const seg = await prisma.segment.findUnique({ where: { id: body.segmentId } });
      if (!seg) return res.status(404).json({ error: 'Segment not found' });
      const clients = await prisma.client.findMany({ where: { deletedAt: null } });
      phones = clients.map((c) => c.phone).filter(Boolean) as string[];
    }
    const normalized = phones.map(normalizePhone);
    // consent check
    const eligible: string[] = [];
    const excluded: { phone: string; reason: string }[] = [];
    for (const ph of normalized) {
      const consent = await prisma.whatsAppConsent.findFirst({ where: { phoneE164: ph, purpose: 'whatsapp_group', channel: 'whatsapp', status: 'granted' } });
      if (!consent) excluded.push({ phone: ph, reason: 'no_consent' }); else eligible.push(ph);
    }
    res.json({ sessionConnected: connected, total: normalized.length, eligible: eligible.length, excluded, eligiblePhones: eligible });
  } catch (e) { next(e); }
}

export async function createGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ session: z.string().default('default'), name: z.string().min(1), segmentId: z.string().uuid().optional(), phones: z.array(z.string()).optional(), idempotencyKey: z.string().optional() }).parse(req.body);
    if (body.idempotencyKey) {
      const existingExec = await prisma.segmentExecution.findUnique({ where: { idempotencyKey: body.idempotencyKey } });
      if (existingExec) return res.status(200).json({ duplicate: true, executionId: existingExec.id });
    }
    const connected = await wahaSessionConnected(body.session);
    if (!connected) return res.status(409).json({ error: 'WAHA session not connected' });

    // gather phones
    let phones: string[] = body.phones || [];
    if (body.segmentId) {
      const clients = await prisma.client.findMany({ where: { deletedAt: null } });
      phones = clients.map((c) => c.phone).filter(Boolean) as string[];
    }
    const normalized = Array.from(new Set(phones.map(normalizePhone)));
    const eligible: string[] = [];
    for (const ph of normalized) {
      const consent = await prisma.whatsAppConsent.findFirst({ where: { phoneE164: ph, purpose: 'whatsapp_group', channel: 'whatsapp', status: 'granted' } });
      if (consent) eligible.push(ph);
    }
    if (eligible.length === 0) return res.status(400).json({ error: 'No eligible participants with consent' });

    // create execution
    const execution = await prisma.segmentExecution.create({
      data: { segmentId: body.segmentId, type: 'whatsapp_group', status: 'processing', totalParticipants: normalized.length, eligibleCount: eligible.length, idempotencyKey: body.idempotencyKey, consentValidated: true, actorId: (req as any).userId } as any,
    });

    // create WAHA group
    const adapter = createWahaAdapter();
    const participants = eligible.map((ph) => ({ id: ph + '@c.us' }));
    const result = await adapter.request(`/api/${body.session}/groups`, { method: 'POST', body: JSON.stringify({ name: body.name, participants }) });
    const wahaGroupId = result?.id || result?.gid || 'unknown';

    const group = await prisma.whatsAppGroup.create({ data: { segmentId: body.segmentId, wahaSession: body.session, wahaGroupId, name: body.name, createdBy: (req as any).userId } });
    for (const ph of eligible) {
      await prisma.whatsAppGroupMember.create({ data: { groupId: group.id, phoneE164: ph, status: 'added' } }).catch(() => {});
    }
    await prisma.segmentExecution.update({ where: { id: execution.id }, data: { status: 'completed', successCount: eligible.length, finishedAt: new Date() } });

    recordAudit((req as any).userId, 'whatsapp.group.create', 'whatsapp_group', group.id, { name: body.name, count: eligible.length }, req.ip);
    res.status(201).json({ group, executionId: execution.id, eligible: eligible.length });
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
}
