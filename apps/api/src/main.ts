import 'dotenv/config';
import { createApp } from './app';
import { env } from './config/env';
import { startOutboxWorker } from './workers/outbox.worker';
import { startWebhookWorker } from './workers/webhook.worker';
import { startDocumentWorker } from './workers/document.worker';
import { logger } from './lib/logger';

const app = createApp();
const port = env.PORT;
app.listen(port, () => {
  logger.info({ port }, 'API listening');
  try { startOutboxWorker(); } catch (e) { logger.warn({ err: e }, 'outbox worker failed to start'); }
  try { startWebhookWorker(); } catch (e) { logger.warn({ err: e }, 'webhook worker failed to start'); }
  try { startDocumentWorker(); } catch (e) { logger.warn({ err: e }, 'document worker failed to start'); }
});
