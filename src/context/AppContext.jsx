import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db, uid, now } from '../db/db';
import { seedDefaults } from '../db/seed';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [rules, setRules] = useState([]);

  const loadAll = useCallback(async () => {
    await seedDefaults();
    const [s, st, p, c, o, oi, conv, msg, r] = await Promise.all([
      db.settings.toArray(),
      db.order_statuses.orderBy('position').toArray(),
      db.products.toArray(),
      db.customers.toArray(),
      db.orders.toArray(),
      db.order_items.toArray(),
      db.chat_conversations.toArray(),
      db.chat_messages.toArray(),
      db.ai_knowledge_rules.toArray(),
    ]);
    setSettings(s[0] || null);
    setStatuses(st);
    setProducts(p);
    setCustomers(c);
    setOrders(o);
    setOrderItems(oi);
    setConversations(conv);
    setMessages(msg);
    setRules(r);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Settings
  const updateSettings = useCallback(async (patch) => {
    const current = await db.settings.get('global');
    const next = { ...current, ...patch };
    await db.settings.put(next);
    setSettings(next);
  }, []);

  // Statuses
  const createStatus = useCallback(async (data) => {
    const item = { id: uid(), position: statuses.length, is_system_default: false, ...data };
    await db.order_statuses.put(item);
    setStatuses(prev => [...prev, item].sort((a,b)=>a.position-b.position));
    return item;
  }, [statuses.length]);
  const updateStatus = useCallback(async (id, patch) => {
    const current = await db.order_statuses.get(id);
    const next = { ...current, ...patch };
    await db.order_statuses.put(next);
    setStatuses(prev => prev.map(s => s.id === id ? next : s).sort((a,b)=>a.position-b.position));
  }, []);
  const deleteStatus = useCallback(async (id) => {
    await db.order_statuses.delete(id);
    setStatuses(prev => prev.filter(s => s.id !== id));
  }, []);
  const reorderStatuses = useCallback(async (orderedIds) => {
    const updated = [];
    for (let i = 0; i < orderedIds.length; i++) {
      const s = statuses.find(x => x.id === orderedIds[i]);
      if (s) { const ns = { ...s, position: i }; await db.order_statuses.put(ns); updated.push(ns); }
    }
    setStatuses(updated.sort((a,b)=>a.position-b.position));
  }, [statuses]);

  // Products
  const createProduct = useCallback(async (data) => {
    const item = { id: uid(), ...data };
    await db.products.put(item);
    setProducts(prev => [item, ...prev]);
    return item;
  }, []);
  const updateProduct = useCallback(async (id, patch) => {
    const current = await db.products.get(id);
    const next = { ...current, ...patch };
    await db.products.put(next);
    setProducts(prev => prev.map(p => p.id === id ? next : p));
  }, []);
  const deleteProduct = useCallback(async (id) => {
    await db.products.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  // Customers
  const createCustomer = useCallback(async (data) => {
    const item = { id: uid(), bot_enabled: true, ...data };
    await db.customers.put(item);
    setCustomers(prev => [item, ...prev]);
    return item;
  }, []);
  const updateCustomer = useCallback(async (id, patch) => {
    const current = await db.customers.get(id);
    const next = { ...current, ...patch };
    await db.customers.put(next);
    setCustomers(prev => prev.map(c => c.id === id ? next : c));
  }, []);
  const deleteCustomer = useCallback(async (id) => {
    await db.customers.delete(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  // Orders
  const createOrder = useCallback(async (data, items = []) => {
    const id = uid();
    const order = { id, created_at: now(), ...data };
    await db.orders.put(order);
    const savedItems = [];
    for (const it of items) {
      const oi = { id: uid(), order_id: id, ...it };
      await db.order_items.put(oi);
      savedItems.push(oi);
    }
    setOrders(prev => [order, ...prev]);
    setOrderItems(prev => [...savedItems, ...prev]);
    return order;
  }, []);
  const updateOrder = useCallback(async (id, patch) => {
    const current = await db.orders.get(id);
    const next = { ...current, ...patch };
    await db.orders.put(next);
    setOrders(prev => prev.map(o => o.id === id ? next : o));
  }, []);
  const deleteOrder = useCallback(async (id) => {
    await db.orders.delete(id);
    const items = await db.order_items.where('order_id').equals(id).toArray();
    await db.order_items.bulkDelete(items.map(i=>i.id));
    setOrders(prev => prev.filter(o => o.id !== id));
    setOrderItems(prev => prev.filter(oi => oi.order_id !== id));
  }, []);

  // Conversations
  const createConversation = useCallback(async (customerId) => {
    const existing = conversations.find(c => c.customer_id === customerId);
    if (existing) return existing;
    const item = { id: uid(), customer_id: customerId, mode: 'auto', last_activity: now() };
    await db.chat_conversations.put(item);
    setConversations(prev => [item, ...prev]);
    return item;
  }, [conversations]);
  const updateConversation = useCallback(async (id, patch) => {
    const current = await db.chat_conversations.get(id);
    const next = { ...current, ...patch, last_activity: now() };
    await db.chat_conversations.put(next);
    setConversations(prev => prev.map(c => c.id === id ? next : c));
  }, []);
  const deleteConversation = useCallback(async (id) => {
    await db.chat_conversations.delete(id);
    const msgs = await db.chat_messages.where('conversation_id').equals(id).toArray();
    await db.chat_messages.bulkDelete(msgs.map(m=>m.id));
    setConversations(prev => prev.filter(c => c.id !== id));
    setMessages(prev => prev.filter(m => m.conversation_id !== id));
  }, []);

  // Messages
  const updateMessage = useCallback(async (id, patch) => {
    const current = await db.chat_messages.get(id);
    const next = { ...current, ...patch };
    await db.chat_messages.put(next);
    setMessages(prev => prev.map(m => m.id === id ? next : m));
    return next;
  }, []);

  const addMessage = useCallback(async (data) => {
    const item = { id: uid(), created_at: now(), ...data };
    await db.chat_messages.put(item);
    setMessages(prev => [...prev, item]);
    // update conversation last_activity
    if (item.conversation_id) {
      const conv = await db.chat_conversations.get(item.conversation_id);
      if (conv) {
        const next = { ...conv, last_activity: now() };
        await db.chat_conversations.put(next);
        setConversations(prev => prev.map(c => c.id === item.conversation_id ? next : c));
      }
    }
    return item;
  }, []);

  // Rules
  const createRule = useCallback(async (data) => {
    const item = { id: uid(), created_at: now(), ...data };
    await db.ai_knowledge_rules.put(item);
    setRules(prev => [item, ...prev]);
    return item;
  }, []);
  const deleteRule = useCallback(async (id) => {
    await db.ai_knowledge_rules.delete(id);
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const value = {
    loading, settings, statuses, products, customers, orders, orderItems, conversations, messages, rules,
    loadAll, updateSettings,
    createStatus, updateStatus, deleteStatus, reorderStatuses,
    createProduct, updateProduct, deleteProduct,
    createCustomer, updateCustomer, deleteCustomer,
    createOrder, updateOrder, deleteOrder,
    createConversation, updateConversation, deleteConversation,
    addMessage, updateMessage, createRule, deleteRule,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}