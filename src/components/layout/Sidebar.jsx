import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Brain, Package, Settings, Users } from 'lucide-react';

const items = [
  { to: '/', label: 'Pedidos', icon: LayoutDashboard },
  { to: '/chat', label: 'Chat Simulador', icon: MessageSquare },
  { to: '/training', label: 'Entrenamiento IA', icon: Brain },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/customers', label: 'Clientes', icon: Users },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight">ChatComercial</h1>
        <p className="text-xs text-slate-400 mt-1">Omnicanal + IA</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 text-xs text-slate-500 border-t border-slate-700">
        v1.0.0
      </div>
    </aside>
  );
}