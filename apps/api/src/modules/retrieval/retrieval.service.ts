import { prisma } from '../../lib/prisma';
import { getEmbeddingConfig, generateEmbeddings } from '../embeddings/embeddings.service';

export interface RetrievalQuery {
  query: string;
  assistantKey?: string;
  collectionIds?: string[];
  topK?: number;
  rrfK?: number;
  userId?: string;
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  versionId: string;
  collectionId: string;
  content: string;
  score: number;
  method: 'vector' | 'text' | 'hybrid';
  vectorRank?: number;
  textRank?: number;
  vectorScore?: number;
  textScore?: number;
  rrfScore?: number;
  metadata: any;
}

export interface RetrievalResult {
  query: string;
  vectorAvailable: boolean;
  textAvailable: boolean;
  results: RetrievedChunk[];
  warnings: string[];
  durationMs: number;
}

const MAX_QUERY = 2000;
const MAX_TOPK = 50;

function normalizeQuery(q: string) {
  return q.trim().slice(0, MAX_QUERY);
}

async function allowedCollections(userId: string | undefined, assistantKey: string | undefined, requested?: string[]): Promise<string[]> {
  // collections linked to assistant if provided
  let allowed: string[] = [];
  if (assistantKey) {
    const a = await prisma.aIAssistant.findUnique({ where: { key: assistantKey }, include: { knowledgeCollections: true } });
    if (a) allowed = a.knowledgeCollections.map((k) => k.collectionId);
  }
  if (requested && requested.length) {
    allowed = allowed.length ? allowed.filter((c) => requested.includes(c)) : requested;
  }
  // RBAC: if no assistant, allow all collections user can read? For simplicity, all collections.
  if (!allowed.length && !assistantKey) {
    const cols = await prisma.knowledgeCollection.findMany({ where: { deletedAt: null }, select: { id: true } });
    allowed = cols.map((c) => c.id);
  }
  return allowed;
}

export async function vectorSearch(q: string, collectionIds: string[], topK: number): Promise<RetrievedChunk[]> {
  const cfg = await getEmbeddingConfig();
  if (!cfg) return [];
  // generate query embedding
  let vectors: number[][];
  try {
    const r = await generateEmbeddings(cfg.providerKey, cfg.modelId, [q]);
    vectors = r.vectors;
  } catch {
    return [];
  }
  if (!vectors[0] || vectors[0].length !== cfg.dimension) return [];
  const qv = vectors[0];
  const collFilter = collectionIds.length ? `AND kd."collectionId" = ANY($5::uuid[])` : '';
  const params: any[] = [`[${qv.join(',')}]`, cfg.dimension, cfg.modelId, topK, collectionIds];
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT kc.id AS "chunkId", kc.content, kc."versionId", kd."collectionId" AS "collectionId", kd.id AS "documentId",
            (ke.vector::vector(${cfg.dimension}) <=> $1::vector(${cfg.dimension})) AS distance
     FROM "KnowledgeEmbedding" ke
     JOIN "KnowledgeChunk" kc ON kc.id = ke."chunkId"
     JOIN "KnowledgeDocumentVersion" dv ON dv.id = kc."versionId"
     JOIN "KnowledgeDocument" kd ON kd.id = dv."documentId"
     WHERE ke.dimension = $2 AND ke."modelId" = $3::uuid
       AND dv.id = kd."currentVersionId"
       AND kd."deletedAt" IS NULL AND kd.status <> 'deleted'
       ${collFilter}
     ORDER BY ke.vector::vector(${cfg.dimension}) <=> $1::vector(${cfg.dimension})
     LIMIT $4`,
    ...params
  );
  return rows.map((r) => ({
    chunkId: r.chunkId,
    documentId: r.documentId,
    versionId: r.versionId,
    collectionId: r.collectionId,
    content: r.content,
    score: 1 - (r.distance || 0),
    method: 'vector',
    metadata: {},
  }));
}

export async function textSearch(q: string, collectionIds: string[], topK: number): Promise<RetrievedChunk[]> {
  const collFilter = collectionIds.length ? `AND kd."collectionId" = ANY($3::uuid[])` : '';
  const params: any[] = [q, topK, collectionIds];
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT kc.id AS "chunkId", kc.content, kc."versionId", kd."collectionId" AS "collectionId", kd.id AS "documentId",
            ts_rank(to_tsvector('spanish', kc.content), plainto_tsquery('spanish', $1)) AS rank
     FROM "KnowledgeChunk" kc
     JOIN "KnowledgeDocumentVersion" dv ON dv.id = kc."versionId"
     JOIN "KnowledgeDocument" kd ON kd.id = dv."documentId"
     WHERE to_tsvector('spanish', kc.content) @@ plainto_tsquery('spanish', $1)
       AND dv.id = kd."currentVersionId"
       AND kd."deletedAt" IS NULL AND kd.status <> 'deleted'
       ${collFilter}
     ORDER BY rank DESC
     LIMIT $2`,
    ...params
  );
  return rows.map((r) => ({
    chunkId: r.chunkId,
    documentId: r.documentId,
    versionId: r.versionId,
    collectionId: r.collectionId,
    content: r.content,
    score: r.rank || 0,
    method: 'text',
    metadata: {},
  }));
}

export async function retrieve(query: RetrievalQuery): Promise<RetrievalResult> {
  const start = Date.now();
  const q = normalizeQuery(query.query);
  const topK = Math.min(MAX_TOPK, Math.max(1, query.topK || 5));
  const warnings: string[] = [];
  const collectionIds = await allowedCollections(query.userId, query.assistantKey, query.collectionIds);

  // vector
  let vectorResults: RetrievedChunk[] = [];
  let vectorAvailable = true;
  try {
    vectorResults = await vectorSearch(q, collectionIds, topK);
  } catch (e: any) {
    vectorAvailable = false;
    warnings.push('Vector search unavailable: ' + e.message);
  }
  if (vectorResults.length === 0) {
    // check if config missing
    const cfg = await getEmbeddingConfig();
    if (!cfg) { vectorAvailable = false; warnings.push('No embedding config set'); }
  }

  // text
  let textResults: RetrievedChunk[] = [];
  let textAvailable = true;
  try {
    textResults = await textSearch(q, collectionIds, topK);
  } catch (e: any) {
    textAvailable = false;
    warnings.push('Text search failed: ' + e.message);
  }

  // RRF fusion
  const k = 60;
  const vectorRanked = [...vectorResults].sort((a,b) => b.score - a.score);
  const textRanked = [...textResults].sort((a,b) => b.score - a.score);
  const vRank = new Map<string, number>();
  vectorRanked.forEach((r, i) => vRank.set(r.chunkId, i + 1));
  const tRank = new Map<string, number>();
  textRanked.forEach((r, i) => tRank.set(r.chunkId, i + 1));
  const vScore = new Map<string, number>();
  vectorRanked.forEach((r) => vScore.set(r.chunkId, r.score));
  const tScore = new Map<string, number>();
  textRanked.forEach((r) => tScore.set(r.chunkId, r.score));

  const allIds = new Set<string>([...vectorResults.map(r=>r.chunkId), ...textResults.map(r=>r.chunkId)]);
  const fused: RetrievedChunk[] = [];
  for (const id of allIds) {
    const vr = vRank.get(id);
    const tr = tRank.get(id);
    let rrf = 0;
    if (vr) rrf += 1 / (k + vr);
    if (tr) rrf += 1 / (k + tr);
    // find base chunk
    const base = vectorResults.find(r=>r.chunkId===id) || textResults.find(r=>r.chunkId===id)!;
    fused.push({
      ...base,
      method: vr && tr ? 'hybrid' : (vr ? 'vector' : 'text'),
      vectorRank: vr,
      textRank: tr,
      vectorScore: vScore.get(id),
      textScore: tScore.get(id),
      rrfScore: rrf,
      score: rrf,
    });
  }
  const results = fused.sort((a,b) => (b.rrfScore||0) - (a.rrfScore||0)).slice(0, topK);

  return { query: q, vectorAvailable, textAvailable, results, warnings, durationMs: Date.now() - start };
}
