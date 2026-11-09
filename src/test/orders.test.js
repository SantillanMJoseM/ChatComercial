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
    if (!cust) { cust = { id: uid(), name: 'Test', phone: '1', bot_enabled: true }; await db.customers.put(cust); }
    const order = { id: uid(), customer_id: cust.id, status_id: statuses[0].id, total: 100, created_at: new Date().toISOString(), source: 'Manual' };
    await db.orders.put(order);
    await db.order_items.put({ id: uid(), order_id: order.id, product_id: 'p1', quantity: 2, unit_price: 50, custom_specs: { width: '100' } });
    const items = await db.order_items.where('order_id').equals(order.id).toArray();
    expect(items.length).toBe(1);
    expect(items[0].custom_specs.width).toBe('100');
  });

  it('updates order status', async () => {
    const statuses = await db.order_statuses.toArray();
    const order = { id: uid(), customer_id: 'c1', status_id: statuses[0].id, total: 0, created_at: new Date().toISOString(), source: 'Manual' };
    await db.orders.put(order);
    await db.orders.update(order.id, { status_id: statuses[1].id });
    const updated = await db.orders.get(order.id);
    expect(updated.status_id).toBe(statuses[1].id);
  });
});