import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const AppContext = createContext(null);

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

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
    setLoading(true);
    try {
      const [s, st, p, c, o, conv, r] = await Promise.all([
        api('/settings'),
        api('/order-statuses'),
        api('/products'),
        api('/customers'),
        api('/orders'),
        api('/conversations'),
        api('/rules'),
      ]);
      setSettings(s);
      setStatuses(st);
      setProducts(p);
      setCustomers(c);
      setOrders(o);
      setOrderItems(o.flatMap(x => x.items || []));
      setConversations(conv);
      setMessages(conv.flatMap(x => (x.messages || []).map(m => ({ ...m, conversationId: x.id }))));
      setRules(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Settings
  const updateSettings = useCallback(async (patch) => {
    const next = await api('/settings', { method: 'PUT', body: JSON.stringify(patch) });
    setSettings(next);
  }, []);

  // Statuses
  const createStatus = useCallback(async (data) => {
    const item = await api('/order-statuses', { method: 'POST', body: JSON.stringify(data) });
    setStatuses(prev => [...prev, item].sort((a,b)=>a.position-b.position));
    return item;
  }, []);
  const updateStatus = useCallback(async (id, patch) => {
    const next = await api(`/order-statuses/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
    setStatuses(prev => prev.map(s => s.id === id ? next : s).sort((a,b)=>a.position-b.position));
  }, []);
  const deleteStatus = useCallback(async (id) => {
    await api(`/order-statuses/${id}`, { method: 'DELETE' });
    setStatuses(prev => prev.filter(s => s.id !== id));
  }, []);
  const reorderStatuses = useCallback(async (orderedIds) => {
    const updated = [];
    for (let i = 0; i < orderedIds.length; i++) {
      const s = statuses.find(x => x.id === orderedIds[i]);
      if (s) {
        const ns = await api(`/order-statuses/${s.id}`, { method: 'PUT', body: JSON.stringify({ ...s, position: i }) });
        updated.push(ns);
      }
    }
    setStatuses(updated.sort((a,b)=>a.position-b.position));
  }, [statuses]);

  // Products
  const createProduct = useCallback(async (data) => {
    const item = await api('/products', { method: 'POST', body: JSON.stringify(data) });
    setProducts(prev => [item, ...prev]);
    return item;
  }, []);
  const updateProduct = useCallback(async (id, patch) => {
    const next = await api(`/products/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
    setProducts(prev => prev.map(p => p.id === id ? next : p));
  }, []);
  const deleteProduct = useCallback(async (id) => {
    await api(`/products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  // Customers
  const createCustomer = useCallback(async (data) => {
    const item = await api('/customers', { method: 'POST', body: JSON.stringify(data) });
    setCustomers(prev => [item, ...prev]);
    return item;
  }, []);
  const updateCustomer = useCallback(async (id, patch) => {
    const next = await api(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
    setCustomers(prev => prev.map(c => c.id === id ? next : c));
  }, []);
  const deleteCustomer = useCallback(async (id) => {
    await api(`/customers/${id}`, { method: 'DELETE' });
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  // Orders
  const createOrder = useCallback(async (data, items = []) => {
    const order = await api('/orders', { method: 'POST', body: JSON.stringify({ ...data, items }) });
    setOrders(prev => [order, ...prev]);
    setOrderItems(prev => [...(order.items || []), ...prev]);
    return order;
  }, []);
  const updateOrder = useCallback(async (id, patch) => {
    const order = await api(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...order } : o));
    if (order.items) {
      setOrderItems(prev => [...order.items, ...prev.filter(i => i.orderId !== id && i.order_id !== id)]);
    }
  }, []);
  const deleteOrder = useCallback(async (id) => {
    await api(`/orders/${id}`, { method: 'DELETE' });
    setOrders(prev => prev.filter(o => o.id !== id));
    setOrderItems(prev => prev.filter(i => (i.orderId || i.order_id) !== id));
  }, []);

  // Conversations
  const createConversation = useCallback(async (customerId) => {
    const existing = conversations.find(c => c.customerId === customerId);
    if (existing) return existing;
    const item = await api('/conversations', { method: 'POST', body: JSON.stringify({ customerId, mode: 'auto' }) });
    setConversations(prev => [item, ...prev]);
    return item;
  }, [conversations]);
  const updateConversation = useCallback(async (id, patch) => {
    const next = await api(`/conversations/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
    setConversations(prev => prev.map(c => c.id === id ? next : c));
  }, []);
  const deleteConversation = useCallback(async (id) => {
    await api(`/conversations/${id}`, { method: 'DELETE' });
    setConversations(prev => prev.filter(c => c.id !== id));
    setMessages(prev => prev.filter(m => (m.conversationId || m.conversation_id) !== id));
  }, []);

  // Messages
  const addMessage = useCallback(async (data) => {
    const item = await api('/messages', { method: 'POST', body: JSON.stringify(data) });
    setMessages(prev => [...prev, item]);
    return item;
  }, []);
  const updateMessage = useCallback(async (id, patch) => {
    const next = await api(`/messages/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
    setMessages(prev => prev.map(m => m.id === id ? next : m));
    return next;
  }, []);

  // Rules
  const createRule = useCallback(async (data) => {
    const item = await api('/rules', { method: 'POST', body: JSON.stringify(data) });
    setRules(prev => [item, ...prev]);
    return item;
  }, []);
  const deleteRule = useCallback(async (id) => {
    await api(`/rules/${id}`, { method: 'DELETE' });
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