import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, List, Columns, Filter } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { money } from '../utils/format';
import { db, uid } from '../db/db';

function DroppableColumn({ id, children }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className="min-h-[100px]">{children}</div>;
}

function OrderCard({ order, customer, items, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 cursor-grab active:cursor-grabbing mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-slate-400">#{order.id.slice(0,6)}</span>
        <span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString('es-AR')}</span>
      </div>
      <div className="font-semibold text-slate-800 text-sm">{customer?.name || 'Sin cliente'}</div>
      <div className="text-xs text-slate-500 mt-1">{items.length} ítem(s)</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-bold text-indigo-600 text-sm">{money(order.total)}</span>
        <button onClick={(e)=>{e.stopPropagation(); onEdit(order);}} className="text-xs text-slate-400 hover:text-indigo-600">Editar</button>
      </div>
      {order.source && <div className="text-[10px] text-slate-400 mt-1">Origen: {order.source}</div>}
    </div>
  );
}

export default function OrdersPage() {
  const { statuses, orders, customers, orderItems, products, createOrder, updateOrder, deleteOrder, loadAll } = useApp();
  const [view, setView] = useState('kanban');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const customerById = (id) => customers.find(c => c.id === id);
  const itemsByOrder = (oid) => orderItems.filter(i => i.order_id === oid);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (filterStatus && o.status_id !== filterStatus) return false;
      if (filterCustomer && o.customer_id !== filterCustomer) return false;
      if (filterDate && !o.created_at.startsWith(filterDate)) return false;
      return true;
    });
  }, [orders, filterStatus, filterCustomer, filterDate]);

  const onDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    // over.id could be status column id or order id; find status
    let newStatus = statuses.find(s => s.id === over.id)?.id;
    if (!newStatus) {
      // dropped over a card -> find that card's status
      const overOrder = orders.find(o => o.id === over.id);
      if (overOrder) newStatus = overOrder.status_id;
    }
    const order = orders.find(o => o.id === active.id);
    if (order && newStatus && order.status_id !== newStatus) {
      await updateOrder(order.id, { status_id: newStatus });
    }
  };

  // Form state
  const [form, setForm] = useState({ customer_id: '', status_id: '', source: '', notes: '', items: [] });
  const openCreate = () => {
    setEditing(null);
    setForm({ customer_id: customers[0]?.id || '', status_id: statuses[0]?.id || '', source: 'Manual', notes: '', items: [] });
    setModalOpen(true);
  };
  const openEdit = (order) => {
    setEditing(order);
    setForm({
      customer_id: order.customer_id,
      status_id: order.status_id,
      source: order.source || '',
      notes: order.notes || '',
      items: itemsByOrder(order.id).map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, custom_specs: i.custom_specs || {} })),
    });
    setModalOpen(true);
  };

  const addItem = () => {
    const p = products[0];
    setForm(f => ({ ...f, items: [...f.items, { product_id: p?.id || '', quantity: 1, unit_price: p?.price || 0, custom_specs: {} }] }));
  };
  const updateItem = (idx, patch) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], ...patch };
      if (patch.product_id) {
        const p = products.find(x => x.id === patch.product_id);
        if (p) items[idx].unit_price = p.price;
      }
      return { ...f, items };
    });
  };
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_,i)=>i!==idx) }));

  const calcTotal = () => form.items.reduce((s,i) => s + (i.quantity||0)*(i.unit_price||0), 0);

  const saveOrder = async () => {
    const total = calcTotal();
    const payload = { customer_id: form.customer_id, status_id: form.status_id, source: form.source, notes: form.notes, total };
    if (editing) {
      await updateOrder(editing.id, payload);
      const old = orderItems.filter(i => i.order_id === editing.id);
      await db.order_items.bulkDelete(old.map(i=>i.id));
      const savedItems = [];
      for (const it of form.items) {
        const oi = { id: uid(), order_id: editing.id, ...it };
        await db.order_items.put(oi);
        savedItems.push(oi);
      }
      setOrderItems(prev => [...savedItems, ...prev.filter(i=>i.order_id !== editing.id)]);
    }
    if (!editing) {
      const items = form.items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, custom_specs: i.custom_specs }));
      await createOrder(payload, items);
    }
    await loadAll();
    setModalOpen(false);
  };

  const activeOrder = activeId ? orders.find(o=>o.id===activeId) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Pedidos</h2>
        <div className="flex items-center gap-2">
          <Button variant={view==='kanban'?'primary':'secondary'} size="sm" onClick={()=>setView('kanban')}><Columns size={16}/> Kanban</Button>
          <Button variant={view==='list'?'primary':'secondary'} size="sm" onClick={()=>setView('list')}><List size={16}/> Lista</Button>
          <Button onClick={openCreate}><Plus size={16}/> Nuevo pedido</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 bg-white p-3 rounded-xl border border-slate-100">
        <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {statuses.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={filterCustomer} onChange={e=>setFilterCustomer(e.target.value)}>
          <option value="">Todos los clientes</option>
          {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={filterDate} onChange={e=>setFilterDate(e.target.value)} />
      </div>

      {view === 'kanban' ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e=>setActiveId(e.active.id)} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map(status => (
              <div key={status.id} className="min-w-[260px] w-[260px] bg-slate-100 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="font-semibold text-sm text-slate-700">{status.name}</span>
                  </div>
                  <span className="text-xs bg-white px-2 py-0.5 rounded-full text-slate-500">{filteredOrders.filter(o=>o.status_id===status.id).length}</span>
                </div>
                <SortableContext items={filteredOrders.filter(o=>o.status_id===status.id).map(o=>o.id)} strategy={verticalListSortingStrategy}>
                  <DroppableColumn id={status.id}>
                    {filteredOrders.filter(o=>o.status_id===status.id).map(order => (
                      <OrderCard key={order.id} order={order} customer={customerById(order.customer_id)} items={itemsByOrder(order.id)} onEdit={openEdit} />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              </div>
            ))}
          </div>
          <DragOverlay>
            {activeOrder ? <div className="bg-white rounded-xl shadow-lg p-3 w-[240px] opacity-90">{customerById(activeOrder.customer_id)?.name}</div> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => {
                const st = statuses.find(s=>s.id===o.status_id);
                return (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0,8)}</td>
                    <td className="px-4 py-3">{customerById(o.customer_id)?.name || '-'}</td>
                    <td className="px-4 py-3"><Badge color={st?.color}>{st?.name}</Badge></td>
                    <td className="px-4 py-3 font-semibold">{money(o.total)}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(o.created_at).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={()=>openEdit(o)} className="text-indigo-600 hover:underline text-xs">Editar</button>
                      <button onClick={()=>deleteOrder(o.id)} className="text-red-600 hover:underline text-xs">Eliminar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editing ? 'Editar pedido' : 'Nuevo pedido'}
        footer={<>
          <Button variant="secondary" onClick={()=>setModalOpen(false)}>Cancelar</Button>
          <Button onClick={saveOrder}>Guardar</Button>
        </>}>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-600">Cliente</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1" value={form.customer_id} onChange={e=>setForm({...form, customer_id:e.target.value})}>
              {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600">Estado</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1" value={form.status_id} onChange={e=>setForm({...form, status_id:e.target.value})}>
              {statuses.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600">Origen</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1" value={form.source} onChange={e=>setForm({...form, source:e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-slate-600">Notas</label>
            <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1" rows={2} value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-600">Ítems</label>
              <Button size="sm" onClick={addItem}>+ Ítem</Button>
            </div>
            {form.items.map((it, idx) => {
              const prod = products.find(p=>p.id===it.product_id);
              const isCustom = prod?.is_custom_dimensions;
              return (
                <div key={idx} className="border border-slate-100 rounded-xl p-3 mb-2 space-y-2">
                  <div className="flex gap-2">
                    <select className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm" value={it.product_id} onChange={e=>updateItem(idx,{product_id:e.target.value})}>
                      {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" min={1} className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm" value={it.quantity} onChange={e=>updateItem(idx,{quantity:Number(e.target.value)})} />
                    <input type="number" className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-sm" value={it.unit_price} onChange={e=>updateItem(idx,{unit_price:Number(e.target.value)})} />
                    <button onClick={()=>removeItem(idx)} className="text-red-500 text-sm px-2">✕</button>
                  </div>
                  {isCustom && (
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="Ancho (cm)" className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" onChange={e=>updateItem(idx,{custom_specs:{...it.custom_specs, width:e.target.value}})} value={it.custom_specs?.width||''} />
                      <input placeholder="Alto (cm)" className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" onChange={e=>updateItem(idx,{custom_specs:{...it.custom_specs, height:e.target.value}})} value={it.custom_specs?.height||''} />
                      <input placeholder="Línea/vidrio" className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" onChange={e=>updateItem(idx,{custom_specs:{...it.custom_specs, spec:e.target.value}})} value={it.custom_specs?.spec||''} />
                    </div>
                  )}
                </div>
              );
            })}
            <div className="text-right font-bold text-indigo-600">Total: {money(calcTotal())}</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
