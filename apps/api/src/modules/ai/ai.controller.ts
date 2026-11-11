import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { encrypt, decrypt } from '../../lib/crypto';
import { recordAudit } from '../audit/audit.controller';

// Providers
export async function listProviders(req: Request, res: Response, next: NextFunction) {
  try {
    const providers = await prisma.aIProvider.findMany({ include: { models: true } });
    res.json(providers.map((p) => ({ ...p, apiKeyEncrypted: undefined })));
  } catch (e) { next(e); }
}

export async function createProvider(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ key: z.string().min(1), name: z.string().min(1), baseUrl: z.string().url(), apiKey: z.string().min(1), capabilities: z.any().optional(), isActive: z.boolean().optional() }).parse(req.body);
    const p = await prisma.aIProvider.create({ data: { key: body.key, name: body.name, baseUrl: body.baseUrl, apiKeyEncrypted: encrypt(body.apiKey), capabilities: body.capabilities, isActive: body.isActive ?? false } });
    recordAudit((req as any).userId, 'ai.provider.create', 'ai_provider', p.key, { name: p.name }, req.ip);
    res.status(201).json({ ...p, apiKeyEncrypted: undefined });
  } catch (e) { next(e); }
}

export async function updateProvider(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ name: z.string().optional(), baseUrl: z.string().url().optional(), apiKey: z.string().optional(), capabilities: z.any().optional(), isActive: z.boolean().optional() }).parse(req.body);
    const data: any = { ...body };
    if (body.apiKey) { data.apiKeyEncrypted = encrypt(body.apiKey); delete data.apiKey; }
    const p = await prisma.aIProvider.update({ where: { key: req.params.key }, data });
    res.json({ ...p, apiKeyEncrypted: undefined });
  } catch (e) { next(e); }
}

export async function testProvider(req: Request, res: Response, next: NextFunction) {
  try {
    const p = await prisma.aIProvider.findUnique({ where: { key: req.params.key } });
    if (!p) return res.status(404).json({ error: 'Not found' });
    const apiKey = decrypt(p.apiKeyEncrypted);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const url = p.baseUrl.replace(/\/$/, '') + '/models';
    const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` }, signal: ctrl.signal });
    clearTimeout(t);
    const text = await r.text();
    res.json({ ok: r.ok, status: r.status, preview: text.slice(0, 200) });
  } catch (e: any) { res.status(502).json({ ok: false, error: e.message }); }
}

// Models
export async function listModels(req: Request, res: Response, next: NextFunction) {
  try {
    const models = await prisma.aIModel.findMany({ include: { provider: true } });
    res.json(models);
  } catch (e) { next(e); }
}

export async function createModel(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ providerKey: z.string(), modelId: z.string(), displayName: z.string(), capabilities: z.any().optional(), contextWindow: z.number().int().optional(), maxOutputTokens: z.number().int().optional(), inputPrice: z.number().optional(), outputPrice: z.number().optional(), isActive: z.boolean().optional() }).parse(req.body);
    const m = await prisma.aIModel.create({ data: { providerKey: body.providerKey, modelId: body.modelId, displayName: body.displayName, capabilities: body.capabilities || {}, contextWindow: body.contextWindow, maxOutputTokens: body.maxOutputTokens, inputPrice: body.inputPrice, outputPrice: body.outputPrice, isActive: body.isActive ?? true } });
    res.status(201).json(m);
  } catch (e) { next(e); }
}

// Assistants
export async function listAssistants(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.aIAssistant.findMany({ include: { model: true, provider: true, tools: { include: { tool: true } } } });
    res.json(items);
  } catch (e) { next(e); }
}

export async function createAssistant(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ key: z.string().min(1), name: z.string().min(1), description: z.string().optional(), providerKey: z.string(), modelId: z.string().uuid(), systemPrompt: z.string().min(1), temperature: z.number().optional(), topP: z.number().optional(), maxTokens: z.number().int().optional(), mode: z.enum(['disabled','assist','approval','auto']).optional(), usageLimits: z.any().optional(), isActive: z.boolean().optional() }).parse(req.body);
    const a = await prisma.aIAssistant.create({ data: { key: body.key, name: body.name, description: body.description, providerKey: body.providerKey, modelId: body.modelId, systemPrompt: body.systemPrompt, temperature: body.temperature, topP: body.topP, maxTokens: body.maxTokens, mode: body.mode ?? 'disabled', usageLimits: body.usageLimits, isActive: body.isActive ?? true } });
    recordAudit((req as any).userId, 'ai.assistant.create', 'ai_assistant', a.key, { name: a.name }, req.ip);
    res.status(201).json(a);
  } catch (e) { next(e); }
}

export async function updateAssistant(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ name: z.string().optional(), description: z.string().optional(), systemPrompt: z.string().optional(), temperature: z.number().optional(), topP: z.number().optional(), maxTokens: z.number().int().optional(), mode: z.enum(['disabled','assist','approval','auto']).optional(), usageLimits: z.any().optional(), isActive: z.boolean().optional(), modelId: z.string().uuid().optional() }).parse(req.body);
    const a = await prisma.aIAssistant.update({ where: { key: req.params.key }, data: body });
    res.json(a);
  } catch (e) { next(e); }
}

// Tools
export async function listTools(req: Request, res: Response, next: NextFunction) {
  try { res.json(await prisma.aITool.findMany()); } catch (e) { next(e); }
}

export async function createTool(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ key: z.string().min(1), name: z.string().min(1), description: z.string().optional(), schema: z.any(), requiredPermission: z.string().optional() }).parse(req.body);
    const t = await prisma.aITool.create({ data: { ...body, schema: body.schema || {} } });
    res.status(201).json(t);
  } catch (e) { next(e); }
}

// Execution (chat)
export async function executeChat(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ assistantKey: z.string(), messages: z.array(z.object({ role: z.string(), content: z.string() })), context: z.any().optional() }).parse(req.body);
    const assistant = await prisma.aIAssistant.findUnique({ where: { key: body.assistantKey }, include: { model: true, provider: true } });
    if (!assistant || !assistant.isActive) return res.status(404).json({ error: 'Assistant not found or inactive' });
    if (assistant.mode === 'disabled') return res.status(403).json({ error: 'Assistant disabled' });

    const apiKey = decrypt(assistant.provider.apiKeyEncrypted);
    const url = assistant.provider.baseUrl.replace(/\/$/, '') + '/chat/completions';
    const messages = [{ role: 'system', content: assistant.systemPrompt }, ...body.messages];
    const payload: any = { model: assistant.model.modelId, messages, temperature: assistant.temperature ?? undefined, top_p: assistant.topP ?? undefined, max_tokens: assistant.maxTokens ?? undefined };

    const started = Date.now();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
    clearTimeout(t);
    const data = await r.json();
    const latency = Date.now() - started;
    const inputTokens = data?.usage?.prompt_tokens || 0;
    const outputTokens = data?.usage?.completion_tokens || 0;
    const content = data?.choices?.[0]?.message?.content || '';

    const exec = await prisma.aIExecution.create({ data: { assistantId: assistant.id, mode: assistant.mode, inputTokens, outputTokens, latencyMs: latency, status: r.ok ? 'completed' : 'failed', error: r.ok ? null : JSON.stringify(data).slice(0,500) } });
    await prisma.aIUsageRecord.create({ data: { providerKey: assistant.provider.key, modelId: assistant.model.id, assistantId: assistant.id, executionId: exec.id, inputTokens, outputTokens } }).catch(() => {});

    if (!r.ok) return res.status(502).json({ error: 'Provider error', details: data });
    res.json({ executionId: exec.id, content, usage: { inputTokens, outputTokens }, latencyMs: latency });
  } catch (e: any) { next(e); }
}

// Usage
export async function getUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const agg = await prisma.aIUsageRecord.groupBy({ by: ['providerKey'], _sum: { inputTokens: true, outputTokens: true }, _count: { _all: true } });
    res.json(agg);
  } catch (e) { next(e); }
}

// Audit / traceability
export async function listQueries(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const pageSize = Math.min(100, parseInt((req.query.pageSize as string) || '20'));
    const assistantKey = req.query.assistantKey as string | undefined;
    const where: any = {};
    if (assistantKey) where.assistant = { key: assistantKey };
    const [items, total] = await Promise.all([
      prisma.aIExecution.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page-1)*pageSize, take: pageSize, include: { assistant: true, user: true } }),
      prisma.aIExecution.count({ where }),
    ]);
    res.json({ items, total, page, pageSize });
  } catch (e) { next(e); }
}

export async function getQuery(req: Request, res: Response, next: NextFunction) {
  try {
    const exec = await prisma.aIExecution.findUnique({ where: { id: req.params.id }, include: { assistant: true, user: true, feedbacks: true } });
    if (!exec) return res.status(404).json({ error: 'Not found' });
    res.json(exec);
  } catch (e) { next(e); }
}

export async function getCitations(req: Request, res: Response, next: NextFunction) {
  try {
    const refs = await prisma.knowledgeSourceReference.findMany({ where: { executionId: req.params.id }, include: { chunk: { include: { version: { include: { document: true } } } } } });
    res.json(refs);
  } catch (e) { next(e); }
}

export async function createFeedback(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ executionId: z.string().uuid(), rating: z.string(), comment: z.string().optional() }).parse(req.body);
    const fb = await prisma.aIRagFeedback.create({ data: { executionId: body.executionId, userId: (req as any).userId, rating: body.rating, comment: body.comment } });
    res.status(201).json(fb);
  } catch (e) { next(e); }
}

export async function listFeedback(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.aIRagFeedback.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { user: true } });
    res.json(items);
  } catch (e) { next(e); }
}
