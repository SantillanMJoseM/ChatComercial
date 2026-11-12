import 'dotenv/config';
import { createApp } from './app';
import { env } from './config/env';
import { startOutboxWorker } from './workers/outbox.worker';
import { startWebhookWorker } from './workers/webhook.worker';
import { startDocumentWorker } from './workers/document.worker';
import { startAutomationTriggerWorker } from './workers/automation-trigger.worker';
import { startAutomationExecutionWorker } from './workers/automation-execution.worker';
import { startEmbeddingsWorker } from './workers/embeddings.worker';
import { logger } from './lib/logger';

const app = createApp();
const port = env.PORT;
app.listen(port, () => {
  logger.info({ port }, 'API listening');
  try { startOutboxWorker(); } catch (e) { logger.warn({ err: e }, 'outbox worker failed to start'); }
  try { startWebhookWorker(); } catch (e) { logger.warn({ err: e }, 'webhook worker failed to start'); }
  try { startDocumentWorker(); } catch (e) { logger.warn({ err: e }, 'document worker failed to start'); }
  try { startAutomationTriggerWorker(); } catch (e) { logger.warn({ err: e }, 'automation trigger worker failed to start'); }
  try { startAutomationExecutionWorker(); } catch (e) { logger.warn({ err: e }, 'automation execution worker failed to start'); }
  try { startEmbeddingsWorker(); } catch (e) { logger.warn({ err: e }, 'embeddings worker failed to start'); }
});
