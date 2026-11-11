import { prisma } from '../../lib/prisma';
import { decrypt } from '../../lib/crypto';

export interface EmbeddingConfig { providerKey: string; modelId: string; dimension: number; metric: string; batchSize: number; }

export async function getEmbeddingConfig(): Promise<EmbeddingConfig | null> {
  const cfg = await prisma.aIConfiguration.findUnique({ where: { key: 'embedding.default' } });
  if (!cfg) return null;
  return cfg.value as any;
}

export async function setEmbeddingConfig(cfg: EmbeddingConfig) {
  await prisma.aIConfiguration.upsert({ where: { key: 'embedding.default' }, update: { value: cfg as any }, create: { key: 'embedding.default', value: cfg as any } });
}

export async function generateEmbeddings(providerKey: string, modelDbId: string, inputs: string[]): Promise<{ vectors: number[][]; dimension: number; tokens?: number }> {
  const provider = await prisma.aIProvider.findUnique({ where: { key: providerKey } });
  if (!provider || !provider.isActive) throw new Error('Provider not found or inactive');
  const model = await prisma.aIModel.findUnique({ where: { id: modelDbId } });
  if (!model) throw new Error('Model not found');
  const apiKey = decrypt(provider.apiKeyEncrypted);
  const url = provider.baseUrl.replace(/\/$/, '') + '/embeddings';
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 60000);
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model.modelId, input: inputs }),
    signal: ctrl.signal,
  });
  clearTimeout(t);
  const data = await r.json();
  if (!r.ok) throw new Error(`Embedding provider error: ${JSON.stringify(data).slice(0, 300)}`);
  const vectors: number[][] = (data.data || []).map((d: any) => d.embedding);
  const dimension = vectors[0]?.length || 0;
  const tokens = data.usage?.total_tokens;
  return { vectors, dimension, tokens };
}
