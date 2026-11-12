import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { evaluateConditions } from './conditions/evaluator';
import { getActionDef } from './actions/registry';
import { recordAudit } from '../audit/audit.controller';
import { ingestEvent, validateEvent } from './events.service';
import { TRIGGER_TYPES } from './triggers.service';

export async function listAutomations(req: Request, res: Response, next: NextFunction) {
  try { res.json(await prisma.automation.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } })); } catch (e) { next(e); }
}
export async function createAutomation(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ name: z.string().min(1), description: z.string().optional(), category: z.string().optional() }).parse(req.body);
    const a = await prisma.automation.create({ data: { ...body, status: 'draft', createdBy: (req as any).userId } as any });
    recordAudit((req as any).userId, 'automation.create', 'automation', a.id, { name: a.name }, req.ip);
    res.status(201).json(a);
  } catch (e) { next(e); }
}
export async function getAutomation(req: Request, res: Response, next: NextFunction) {
  try {
    const a = await prisma.automation.findUnique({ where: { id: req.params.id }, include: { versions: true, schedules: true } });
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json(a);
  } catch (e) { next(e); }
}
export async function updateAutomation(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ name: z.string().optional(), description: z.string().optional(), category: z.string().optional(), status: z.string().optional() }).parse(req.body);
    const a = await prisma.automation.update({ where: { id: req.params.id }, data: body });
    res.json(a);
  } catch (e) { next(e); }
}
export async function deleteAutomation(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.automation.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), status: 'disabled' } });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

// Versions
export async function listVersions(req: Request, res: Response, next: NextFunction) {
  try { res.json(await prisma.automationVersion.findMany({ where: { automationId: req.params.id }, orderBy: { version: 'desc' } })); } catch (e) { next(e); }
}
export async function createVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ version: z.number().int(), trigger: z.any(), conditions: z.any().optional(), actions: z.any(), timezone: z.string().optional() }).parse(req.body);
    const v = await prisma.automationVersion.create({ data: { automationId: req.params.id, ...body, status: 'draft', createdBy: (req as any).userId } as any });
    res.status(201).json(v);
  } catch (e) { next(e); }
}
export async function publishVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ versionId: z.string().uuid() }).parse(req.body);
    await prisma.automationVersion.update({ where: { id: body.versionId }, data: { status: 'published', publishedAt: new Date() } });
    await prisma.automation.update({ where: { id: req.params.id }, data: { publishedVersionId: body.versionId, status: 'published' } });
    recordAudit((req as any).userId, 'automation.publish', 'automation', req.params.id, { versionId: body.versionId }, req.ip);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

// Executions
export async function listExecutions(req: Request, res: Response, next: NextFunction) {
  try { res.json(await prisma.automationExecution.findMany({ where: { automationId: req.params.id }, orderBy: { startedAt: 'desc' }, take: 100 })); } catch (e) { next(e); }
}

// Reports
export async function listReports(req: Request, res: Response, next: NextFunction) {
  try { res.json(await prisma.reportDefinition.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } })); } catch (e) { next(e); }
}
export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ name: z.string().min(1), description: z.string().optional(), query: z.any(), filters: z.any().optional() }).parse(req.body);
    const r = await prisma.reportDefinition.create({ data: { ...body, createdBy: (req as any).userId } as any });
    res.status(201).json(r);
  } catch (e) { next(e); }
}

// Notifications
export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try { res.json(await prisma.notification.findMany({ where: { userId: (req as any).userId }, orderBy: { createdAt: 'desc' }, take: 50 })); } catch (e) { next(e); }
}
export async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    const n = await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    res.json(n);
  } catch (e) { next(e); }
}


export async function ingestEventEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = validateEvent(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid event', details: parsed.error.errors });
    const r = await ingestEvent(req.body);
    res.status(202).json(r);
  } catch (e) { next(e); }
}

export async function listTriggerTypes(req: Request, res: Response, next: NextFunction) {
  try { res.json(TRIGGER_TYPES); } catch (e) { next(e); }
}

export async function dryRunTrigger(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body;
    const { findCandidateAutomations } = await import('./triggers.service');
    const candidates = await findCandidateAutomations(body);
    res.json({ event: body, candidates: candidates.map((c: any) => ({ automationId: c.automation.id, name: c.automation.name, versionId: c.version.id, triggerType: c.trigger.type })), wouldCreate: candidates.length });
  } catch (e) { next(e); }
}

export async function dryRunExecution(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ automationId: z.string().uuid(), versionId: z.string().uuid().optional(), event: z.any() }).parse(req.body);
    const auto = await prisma.automation.findUnique({ where: { id: body.automationId }, include: { publishedVersion: true } });
    if (!auto) return res.status(404).json({ error: 'Not found' });
    const version = body.versionId ? await prisma.automationVersion.findUnique({ where: { id: body.versionId } }) : auto.publishedVersion;
    if (!version) return res.status(400).json({ error: 'No version' });
    const ctx = body.event || {};
    const cond = evaluateConditions(version.conditions, ctx);
    const actions = (version.actions as any[]) || [];
    const wouldExecute = cond.result ? actions.map((a) => ({ type: a.type, def: getActionDef(a.type)?.name, risk: getActionDef(a.type)?.risk, params: a.params })) : [];
    res.json({ automationId: auto.id, versionId: version.id, conditions: cond, wouldExecute, dryRun: true });
  } catch (e) { next(e); }
}

export async function submitAutomationApproval(req: Request, res: Response, next: NextFunction) {
  try {
    const a = await prisma.automation.update({ where: { id: req.params.id }, data: { status: 'pending_approval' } });
    recordAudit((req as any).userId, 'automation.submit_approval', 'automation', a.id, undefined, req.ip);
    res.json(a);
  } catch (e) { next(e); }
}
export async function approveAutomation(req: Request, res: Response, next: NextFunction) {
  try {
    const a = await prisma.automation.update({ where: { id: req.params.id }, data: { status: 'approved' } });
    recordAudit((req as any).userId, 'automation.approve', 'automation', a.id, undefined, req.ip);
    res.json(a);
  } catch (e) { next(e); }
}
export async function rejectAutomation(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ reason: z.string().min(1) }).parse(req.body);
    const a = await prisma.automation.update({ where: { id: req.params.id }, data: { status: 'rejected' } });
    recordAudit((req as any).userId, 'automation.reject', 'automation', a.id, { reason: body.reason }, req.ip);
    res.json(a);
  } catch (e) { next(e); }
}
export async function listPendingApprovals(req: Request, res: Response, next: NextFunction) {
  try {
    const execs = await prisma.automationExecution.findMany({ where: { status: 'awaiting_approval' }, orderBy: { startedAt: 'desc' }, include: { automation: true } });
    const autos = await prisma.automation.findMany({ where: { status: 'pending_approval' }, orderBy: { updatedAt: 'desc' } });
    res.json({ automations: autos, executions: execs });
  } catch (e) { next(e); }
}
