import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

export async function listNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.query.clientId as string;
    const items = await prisma.clientNote.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' }, include: { author: true } });
    res.json(items);
  } catch (e) { next(e); }
}

export async function createNote(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ clientId: z.string().uuid(), body: z.string().min(1) }).parse(req.body);
    const note = await prisma.clientNote.create({ data: { clientId: body.clientId, body: body.body, authorId: (req as any).userId } });
    res.status(201).json(note);
  } catch (e) { next(e); }
}

export async function listInteractions(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.query.clientId as string;
    const items = await prisma.clientInteraction.findMany({ where: { clientId }, orderBy: { occurredAt: 'desc' }, include: { actor: true } });
    res.json(items);
  } catch (e) { next(e); }
}

export async function createInteraction(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ clientId: z.string().uuid(), type: z.string(), summary: z.string().min(1), occurredAt: z.string().optional() }).parse(req.body);
    const interaction = await prisma.clientInteraction.create({ data: { clientId: body.clientId, type: body.type, summary: body.summary, actorId: (req as any).userId, occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined } });
    await prisma.client.update({ where: { id: body.clientId }, data: { lastInteractionAt: new Date() } }).catch(() => {});
    res.status(201).json(interaction);
  } catch (e) { next(e); }
}
