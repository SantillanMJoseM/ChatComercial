import React from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, Users, Package, MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const { orders, customers, products, conversations } = useApp();
  const pending = orders.filter(o => o.statusId && o.statusId !== 'done').length;
  const kpis = [
    { label: 'Pedidos', value: orders.length, icon: ShoppingCart },
    { label: 'Clientes', value: customers.length, icon: Users },
    { label: 'Productos', value: products.length, icon: Package },
    { label: 'Conversaciones', value: conversations.length, icon: MessageSquare },
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-soft border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{k.label}</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{k.value}</div>
              </div>
              <k.icon className="text-indigo-600" size={28} />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-soft border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Actividad reciente</h3>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {orders.slice(0,5).map(o => (
            <li key={o.id}>Pedido #{o.id.slice(0,6)} - {o.total}</li>
          ))}
          {orders.length === 0 && <li>Sin actividad reciente.</li>}
        </ul>
      </div>
    </div>
  );
}