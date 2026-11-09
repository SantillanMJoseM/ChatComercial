// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { db, uid } from '../db/db';
import { seedDefaults } from '../db/seed';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedDefaults();
});

describe('orders', () => {
  it('creates order with items', async () => {
    const statuses = await db.order_statuses.toArray();
    const customers = await db.customers.toArray();
    // seed customer if none
    let cust = customers[0];
    if (!cust) { cust = { id: uid(), name: 'Test', phone: '1', botEnabled: true }; await db.customers.put(cust); }
    const order = { id: uid(), customerId: cust.id, statusId: statuses[0].id, total: 100, createdAt: new Date().toISOString(), source: 'Manual' };
    await db.orders.put(order);
    await db.order_items.put({ id: uid(), orderId: order.id, productId: 'p1', quantity: 2, unitPrice: 50, customSpecs: { width: '100' } });
    const items = await db.order_items.where('orderId').equals(order.id).toArray();
    expect(items.length).toBe(1);
    expect(items[0].customSpecs.width).toBe('100');
  });

  it('updates order status', async () => {
    const statuses = await db.order_statuses.toArray();
    const order = { id: uid(), customerId: 'c1', statusId: statuses[0].id, total: 0, createdAt: new Date().toISOString(), source: 'Manual' };
    await db.orders.put(order);
    await db.orders.update(order.id, { statusId: statuses[1].id });
    const updated = await db.orders.get(order.id);
    expect(updated.statusId).toBe(statuses[1].id);
  });
});