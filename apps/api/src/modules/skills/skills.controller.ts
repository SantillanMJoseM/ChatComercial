import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../audit/audit.controller';

// Skills CRUD
export async function listSkills(req: Request, res: Response, next: NextFunction) {
  try { res.json(await prisma.skill.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' }, include: { versions: true, assistants: true } })); } catch (e) { next(e); }
}
export async function createSkill(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ key: z.string().min(1), name: z.string().min(1), description: z.string().optional(), category: z.string().optional(), objective: z.string().optional() }).parse(req.body);
    const s = await prisma.skill.create({ data: { ...body, status: 'draft', executionMode: 'disabled' } });
    recordAudit((req as any).userId, 'skill.create', 'skill', s.key, { name: s.name }, req.ip);
    res.status(201).json(s);
  } catch (e) { next(e); }
}
export async function getSkill(req: Request, res: Response, next: NextFunction) {
  try {
    const s = await prisma.skill.findUnique({ where: { key: req.params.key }, include: { versions: true, assistants: { include: { assistant: true } } } });
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  } catch (e) { next(e); }
}
export async function updateSkill(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ name: z.string().optional(), description: z.string().optional(), category: z.string().optional(), objective: z.string().optional(), executionMode: z.enum(['disabled','assist','auto']).optional(), timeoutMs: z.number().int().optional(), maxRetries: z.number().int().optional(), isActive: z.boolean().optional() }).parse(req.body);
    const s = await prisma.skill.update({ where: { key: req.params.key }, data: body });
    res.json(s);
  } catch (e) { next(e); }
}

// Versions
export async function listVersions(req: Request, res: Response, next: NextFunction) {
  try {
    const skill = await prisma.skill.findUnique({ where: { key: req.params.key } });
    if (!skill) return res.status(404).json({ error: 'Not found' });
    res.json(await prisma.skillVersion.findMany({ where: { skillId: skill.id }, orderBy: { version: 'desc' } }));
  } catch (e) { next(e); }
}
export async function createVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const skill = await prisma.skill.findUnique({ where: { key: req.params.key } });
    if (!skill) return res.status(404).json({ error: 'Not found' });
    const body = z.object({ version: z.number().int(), instructions: z.string().min(1), parameters: z.any().optional(), parametersSchema: z.any().optional(), requiredPermissions: z.array(z.string()).optional(), category: z.string().optional() }).parse(req.body);
    const v = await prisma.skillVersion.create({ data: { skillId: skill.id, ...body, status: 'draft', createdBy: (req as any).userId } });
    res.status(201).json(v);
  } catch (e) { next(e); }
}
export async function publishVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ versionId: z.string().uuid() }).parse(req.body);
    const v = await prisma.skillVersion.findUnique({ where: { id: body.versionId } });
    if (!v) return res.status(404).json({ error: 'Version not found' });
    // publish version
    await prisma.skillVersion.update({ where: { id: v.id }, data: { status: 'published', publishedAt: new Date(), publishedBy: (req as any).userId } });
    // update skill publishedVersionId
    await prisma.skill.update({ where: { id: v.skillId }, data: { publishedVersionId: v.id, status: 'published' } });
    recordAudit((req as any).userId, 'skill.publish', 'skill', v.skillId, { version: v.version }, req.ip);
    res.json({ ok: true, versionId: v.id });
  } catch (e) { next(e); }
}
export async function disableSkill(req: Request, res: Response, next: NextFunction) {
  try {
    const s = await prisma.skill.update({ where: { key: req.params.key }, data: { status: 'disabled', executionMode: 'disabled' } });
    res.json(s);
  } catch (e) { next(e); }
}

// Assistant links
export async function linkAssistant(req: Request, res: Response, next: NextFunction) {
  try {
    const skill = await prisma.skill.findUnique({ where: { key: req.params.key } });
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    const body = z.object({ assistantId: z.string().uuid() }).parse(req.body);
    const link = await prisma.skillAssistant.upsert({ where: { skillId_assistantId: { skillId: skill.id, assistantId: body.assistantId } }, update: {}, create: { skillId: skill.id, assistantId: body.assistantId } });
    res.status(201).json(link);
  } catch (e) { next(e); }
}

// Tool permissions
export async function setToolPermission(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ skillVersionId: z.string().uuid(), toolId: z.string().uuid(), allowed: z.boolean() }).parse(req.body);
    const p = await prisma.skillToolPermission.upsert({ where: { skillVersionId_toolId: { skillVersionId: body.skillVersionId, toolId: body.toolId } }, update: { allowed: body.allowed }, create: body });
    res.json(p);
  } catch (e) { next(e); }
}

// Execution
export async function executeSkill(req: Request, res: Response, next: NextFunction) {
  try {
    const skill = await prisma.skill.findUnique({ where: { key: req.params.key }, include: { publishedVersion: true } });
    if (!skill || skill.status !== 'published' || skill.executionMode === 'disabled') return res.status(403).json({ error: 'Skill not executable' });
    const version = skill.publishedVersion;
    if (!version) return res.status(400).json({ error: 'No published version' });

    const body = z.object({ assistantId: z.string().uuid().optional(), input: z.any().optional(), approved: z.boolean().optional() }).parse(req.body);

    // mode auto requires approved or assist mode
    if (skill.executionMode === 'auto' && !body.approved) {
      // create pending execution
      const exec = await prisma.skillExecution.create({ data: { skillVersionId: version.id, assistantId: body.assistantId, userId: (req as any).userId, input: body.input, status: 'awaiting_approval' } });
      return res.status(202).json({ executionId: exec.id, status: 'awaiting_approval' });
    }

    const started = Date.now();
    const exec = await prisma.skillExecution.create({ data: { skillVersionId: version.id, assistantId: body.assistantId, userId: (req as any).userId, input: body.input, status: 'running' } });

    // execute based on skill key (reference skills)
    let output: any = null;
    let error: string | null = null;
    try {
      if (skill.key === 'knowledge-query') {
        // call retrieval via internal fetch? Use prisma context not available; return placeholder
        output = { message: 'Knowledge skill executed', query: body.input?.query };
      } else if (skill.key === 'order-status') {
        output = { orderId: body.input?.orderId, status: 'mock: shipped', estimatedDelivery: '2026-11-15' };
      } else if (skill.key === 'create-task') {
        output = { taskCreated: true, title: body.input?.title };
      } else if (skill.key === 'human-handoff') {
        output = { handoff: true, reason: body.input?.reason };
      } else {
        output = { echo: body.input };
      }
    } catch (e: any) { error = e.message; }

    const duration = Date.now() - started;
    await prisma.skillExecution.update({ where: { id: exec.id }, data: { status: error ? 'failed' : 'completed', output, error, durationMs: duration } });

    recordAudit((req as any).userId, 'skill.execute', 'skill', skill.key, { version: version.version, status: error ? 'failed' : 'completed' }, req.ip);
    res.json({ executionId: exec.id, status: error ? 'failed' : 'completed', output, error, durationMs: duration });
  } catch (e) { next(e); }
}

export async function approveExecution(req: Request, res: Response, next: NextFunction) {
  try {
    const exec = await prisma.skillExecution.update({ where: { id: req.params.id }, data: { status: 'completed', approvedBy: (req as any).userId, approvedAt: new Date() } });
    res.json(exec);
  } catch (e) { next(e); }
}
export async function rejectExecution(req: Request, res: Response, next: NextFunction) {
  try {
    const exec = await prisma.skillExecution.update({ where: { id: req.params.id }, data: { status: 'rejected' } });
    res.json(exec);
  } catch (e) { next(e); }
}
export async function listExecutions(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.skillExecution.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { skillVersion: { include: { skill: true } }, user: true } });
    res.json(items);
  } catch (e) { next(e); }
}
export async function getExecution(req: Request, res: Response, next: NextFunction) {
  try {
    const e = await prisma.skillExecution.findUnique({ where: { id: req.params.id }, include: { skillVersion: { include: { skill: true } }, user: true } });
    if (!e) return res.status(404).json({ error: 'Not found' });
    res.json(e);
  } catch (e) { next(e); }
}
