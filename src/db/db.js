import Dexie from 'dexie';

export const db = new Dexie('ChatComercialDB');

db.version(1).stores({
  settings: 'id',
  order_statuses: 'id, position',
  products: 'id, category, sku',
  customers: 'id, phone, botEnabled',
  orders: 'id, customerId, statusId, createdAt, source',
  order_items: 'id, orderId, productId',
  chat_conversations: 'id, customerId, mode, lastActivity',
  chat_messages: 'id, conversation_id, createdAt',
  ai_knowledge_rules: 'id, category, createdAt',
});

export const uid = () => crypto.randomUUID();

export const now = () => new Date().toISOString();