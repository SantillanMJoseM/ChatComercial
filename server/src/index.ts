import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import './seed.js';
import { generateReply } from './llm.js';

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// Settings
app.get('/api/settings', async (_req, res) => {
  let s = await prisma.setting.findUnique({ where: { id: 'global' } });
  if (!s) {
    s = await prisma.setting.create({
      data: {
        id: 'global',
        botResponseMode: 'auto',
        weeklySchedule: {},
        outOfHours: false,
        toneRules: { noOpeningQuestionMark: true, noFinalPeriod: true, useDiscreteEmojis: true },
        globalBotEnabled: true,
      },
    });
  }
  res.json(s);
});
app.put('/api/settings', async (req, res) => {
  const s = await prisma.setting.upsert({
    where: { id: 'global' },
    update: req.body,
    create: { id: 'global', ...req.body },
  });
  res.json(s);
});

// Order statuses
app.get('/api/order-statuses', async (_req, res) => {
  res.json(await prisma.orderStatus.findMany({ orderBy: { position: 'asc' } }));
});
app.post('/api/order-statuses', async (req, res) => {
  const count = await prisma.orderStatus.count();
  const s = await prisma.orderStatus.create({ data: { ...req.body, position: req.body.position ?? count } });
  res.json(s);
});
app.put('/api/order-statuses/:id', async (req, res) => {
  res.json(await prisma.orderStatus.update({ where: { id: req.params.id }, data: req.body }));
});
app.delete('/api/order-statuses/:id', async (req, res) => {
  await prisma.orderStatus.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Products
app.get('/api/products', async (_req, res) => res.json(await prisma.product.findMany()));
app.post('/api/products', async (req, res) => {
  const p = await prisma.product.create({ data: req.body });
  res.json(p);
});
app.put('/api/products/:id', async (req, res) => {
  res.json(await prisma.product.update({ where: { id: req.params.id }, data: req.body }));
});
app.delete('/api/products/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Customers
app.get('/api/customers', async (_req, res) => res.json(await prisma.customer.findMany()));
app.post('/api/customers', async (req, res) => {
  res.json(await prisma.customer.create({ data: req.body }));
});
app.put('/api/customers/:id', async (req, res) => {
  res.json(await prisma.customer.update({ where: { id: req.params.id }, data: req.body }));
});
app.delete('/api/customers/:id', async (req, res) => {
  await prisma.customer.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Orders
app.get('/api/orders', async (_req, res) => {
  res.json(await prisma.order.findMany({ include: { items: true, customer: true, status: true } }));
});
app.post('/api/orders', async (req, res) => {
  const { items, ...data } = req.body;
  const order = await prisma.order.create({
    data: { ...data, items: { create: items || [] } },
    include: { items: true },
  });
  res.json(order);
});
app.put('/api/orders/:id', async (req, res) => {
  const { items, ...data } = req.body;
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { ...data, ...(items ? { items: { deleteMany: {}, create: items } } : {}) },
    include: { items: true },
  });
  res.json(order);
});
app.delete('/api/orders/:id', async (req, res) => {
  await prisma.order.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Conversations
app.get('/api/conversations', async (_req, res) => {
  res.json(await prisma.chatConversation.findMany({ include: { messages: true, customer: true } }));
});
app.post('/api/conversations', async (req, res) => {
  res.json(await prisma.chatConversation.create({ data: req.body }));
});
app.put('/api/conversations/:id', async (req, res) => {
  res.json(await prisma.chatConversation.update({ where: { id: req.params.id }, data: req.body }));
});
app.delete('/api/conversations/:id', async (req, res) => {
  await prisma.chatConversation.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Messages
app.get('/api/messages', async (req, res) => {
  const conversationId = req.query.conversationId as string;
  res.json(await prisma.chatMessage.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' } }));
});
app.post('/api/messages', async (req, res) => {
  res.json(await prisma.chatMessage.create({ data: req.body }));
});
app.put('/api/messages/:id', async (req, res) => {
  res.json(await prisma.chatMessage.update({ where: { id: req.params.id }, data: req.body }));
});

// Rules
app.get('/api/rules', async (_req, res) => res.json(await prisma.aiKnowledgeRule.findMany({ orderBy: { createdAt: 'desc' } })));
app.post('/api/rules', async (req, res) => res.json(await prisma.aiKnowledgeRule.create({ data: req.body })));
app.delete('/api/rules/:id', async (req, res) => {
  await prisma.aiKnowledgeRule.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Auth
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'email already registered' });
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash, name } });
  res.json({ id: user.id, email: user.email, role: user.role });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const bcrypt = await import('bcryptjs');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const jwt = await import('jsonwebtoken');
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.post('/api/ai/chat', async (req, res) => {
  const { prompt } = req.body;
  const reply = await generateReply(prompt || '');
  res.json({ reply });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));