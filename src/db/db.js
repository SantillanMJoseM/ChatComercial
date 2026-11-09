import Dexie from 'dexie';

export const db = new Dexie('ChatComercialDB');

db.version(1).stores({
  settings: 'id',
  order_statuses: 'id, position',
  products: 'id, category, sku',
  customers: 'id, phone, bot_enabled',
  orders: 'id, customer_id, status_id, created_at, source',
  order_items: 'id, order_id, product_id',
  chat_conversations: 'id, customer_id, mode, last_activity',
  chat_messages: 'id, conversation_id, created_at',
  ai_knowledge_rules: 'id, category, created_at',
});

export const uid = () => crypto.randomUUID();

export const now = () => new Date().toISOString();