import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

export const contextConfigSchema = z.object({
  maxTokens: z.number().int().default(2000),
  maxChunks: z.number().int().default(5),
  maxPerDocument: z.number().int().default(2),
  minScore: z.number().default(0),
  includeNeighbors: z.boolean().default(false),
});

export interface ContextSource {
  ref: number;
  chunkId: string;
  documentId: string;
  versionId: string;
  collectionId: string;
  documentName?: string;
  section?: string;
  content: string;
  score: number;
  method: string;
  estimatedTokens: number;
}

export interface BuiltContext {
  contextId: string;
  queryId?: string;
  assistantId?: string;
  sources: ContextSource[];
  contextText: string;
  totalEstimatedTokens: number;
  budget: number;
  excluded: { chunkId: string; reason: string }[];
  sufficient: boolean;
  warnings: string[];
  builtAt: string;
}

function estimateTokens(text: string) { return Math.ceil(text.length / 4); }

export async function buildContext(
  queryId: string | undefined,
  assistantId: string | undefined,
  retrieved: { chunkId: string; documentId: string; versionId: string; collectionId: string; content: string; score: number; method: string }[],
  config: z.infer<typeof contextConfigSchema>
): Promise<BuiltContext> {
  const contextId = crypto.randomUUID();
  const excluded: { chunkId: string; reason: string }[] = [];
  const warnings: string[] = [];

  // fetch document names
  const docIds = Array.from(new Set(retrieved.map((r) => r.documentId)));
  const docs = docIds.length ? await prisma.knowledgeDocument.findMany({ where: { id: { in: docIds } }, select: { id: true, name: true } }) : [];
  const docNameMap = new Map(docs.map((d) => [d.id, d.name]));

  // sort by score desc
  const sorted = [...retrieved].sort((a, b) => b.score - a.score);

  const selected: ContextSource[] = [];
  const perDoc = new Map<string, number>();
  const seenContent = new Set<string>();

  const systemReserved = 500;
  const responseReserved = 500;
  const availableBudget = Math.max(0, config.maxTokens - systemReserved - responseReserved);

  let usedTokens = 0;

  for (const r of sorted) {
    if (selected.length >= config.maxChunks) { excluded.push({ chunkId: r.chunkId, reason: 'maxChunks' }); continue; }
    if (r.score < config.minScore) { excluded.push({ chunkId: r.chunkId, reason: 'belowThreshold' }); continue; }
    const docCount = perDoc.get(r.documentId) || 0;
    if (docCount >= config.maxPerDocument) { excluded.push({ chunkId: r.chunkId, reason: 'maxPerDocument' }); continue; }

    const normalized = r.content.replace(/\s+/g, ' ').trim();
    // dedup by content hash
    const contentHash = crypto.createHash('md5').update(normalized).digest('hex');
    if (seenContent.has(contentHash)) { excluded.push({ chunkId: r.chunkId, reason: 'duplicate' }); continue; }

    const tokens = estimateTokens(normalized);
    if (usedTokens + tokens > availableBudget) { excluded.push({ chunkId: r.chunkId, reason: 'budgetExceeded' }); continue; }

    const source: ContextSource = {
      ref: selected.length + 1,
      chunkId: r.chunkId,
      documentId: r.documentId,
      versionId: r.versionId,
      collectionId: r.collectionId,
      documentName: docNameMap.get(r.documentId),
      content: normalized,
      score: r.score,
      method: r.method,
      estimatedTokens: tokens,
    };
    selected.push(source);
    perDoc.set(r.documentId, docCount + 1);
    seenContent.add(contentHash);
    usedTokens += tokens;
  }

  // build context text with clear separation
  const contextText = selected.map((s) => `[Fuente ${s.ref}: ${s.documentName || s.documentId}]\n${s.content}`).join('\n\n---\n\n');

  const sufficient = selected.length > 0 && usedTokens > 0;

  if (selected.length === 0) warnings.push('No se seleccionaron fragmentos; contexto insuficiente.');

  // persist source references
  // (optional, skip to avoid noise)

  return {
    contextId,
    queryId,
    assistantId,
    sources: selected,
    contextText,
    totalEstimatedTokens: usedTokens,
    budget: config.maxTokens,
    excluded,
    sufficient,
    warnings,
    builtAt: new Date().toISOString(),
  };
}
