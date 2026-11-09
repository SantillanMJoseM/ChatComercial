import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Users, Package, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';

export default function DashboardPage() {
  const { orders, customers, products, conversations, statuses } = useApp();
  const navigate = useNavigate();
  const pendingStatus = statuses.find(s => /nuevo|pend/i.test(s.name));
  const pending = pendingStatus ? orders.filter(o => o.statusId === pendingStatus.id).length : 0;
  const kpis = [
    { label: 'Pedidos totales', value: orders.length, icon: ShoppingCart, color: 'text-indigo-600' },
    { label: 'Clientes', value: customers.length, icon: Users, color: 'text-emerald-600' },
    { label: 'Productos', value: products.length, icon: Package, color: 'text-amber-600' },
    { label: 'Conversaciones', value: conversations.length, icon: MessageSquare, color: 'text-sky-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h2>
        <Button onClick={() => navigate('/')} size="sm">Ver pedidos</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-soft border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{k.label}</div>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{k.value}</div>
              </div>
              <k.icon className={k.color} size={30} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-soft border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Pedidos pendientes</h3>
            <span className="text-2xl font-bold text-amber-600">{pending}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pedidos en estado inicial o pendiente de pago.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-soft border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Accesos rápidos</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => navigate('/chat')}><MessageSquare size={14} /> Chat</Button>
            <Button size="sm" variant="secondary" onClick={() => navigate('/products')}><Package size={14} /> Productos</Button>
            <Button size="sm" variant="secondary" onClick={() => navigate('/customers')}><Users size={14} /> Clientes</Button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-soft border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Actividad reciente</h3>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {orders.slice(0, 8).map(o => (
            <li key={o.id} className="flex items-center justify-between">
              <span>Pedido #{o.id.slice(0, 6)}</span>
              <span className="text-slate-400 dark:text-slate-500">{o.total}</span>
            </li>
          ))}
          {orders.length === 0 && <li>Sin actividad reciente.</li>}
        </ul>
      </div>
    </div>
  );
}