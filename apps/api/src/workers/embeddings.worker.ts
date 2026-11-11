import { Worker, Queue } from 'bullmq';
import { prisma } from '../lib/prisma';
import IORedis from 'ioredis';
import { generateEmbeddings, getEmbeddingConfig } from '../modules/embeddings/embeddings.service';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
export const embeddingsQueue = new Queue('embeddings', { connection });

export function startEmbeddingsWorker() {
  const worker = new Worker('embeddings', async (job) => {
    const { versionId, collectionId } = job.data;
    const cfg = await getEmbeddingConfig();
    if (!cfg) throw new Error('Embedding config not set');

    // find chunks without embedding for this config
    const where: any = {};
    if (versionId) where.versionId = versionId;
    const chunks = await prisma.knowledgeChunk.findMany({
      where,
      include: { embeddings: { where: { modelId: cfg.modelId } } },
    });
    const pending = chunks.filter((c) => c.embeddings.length === 0);
    if (pending.length === 0) return { processed: 0 };

    const batchSize = cfg.batchSize || 100;
    let processed = 0;
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);
      const inputs = batch.map((c) => c.content);
      const { vectors, dimension } = await generateEmbeddings(cfg.providerKey, cfg.modelId, inputs);
      if (dimension !== cfg.dimension) throw new Error(`Dimension mismatch: expected ${cfg.dimension}, got ${dimension}`);
      for (let j = 0; j < batch.length; j++) {
        const id = crypto.randomUUID();
        await prisma.$executeRaw`
          INSERT INTO "KnowledgeEmbedding" (id, "chunkId", "providerKey", "modelId", dimension, vector, "createdAt")
          VALUES (${id}::uuid, ${batch[j].id}::uuid, ${cfg.providerKey}, ${cfg.modelId}::uuid, ${dimension}, ${`[${vectors[j].join(',')}]`}::vector, NOW())
        `;
      }
      processed += batch.length;
    }
    return { processed };
  }, { connection, concurrency: 1 });

  worker.on('failed', (job, err) => console.error('embeddings job failed', job?.id, err?.message));
  return worker;
}
