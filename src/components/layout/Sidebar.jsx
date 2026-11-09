import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Brain, Package, Settings, Users, LogOut } from 'lucide-react';

const items = [
  { to: '/', label: 'Pedidos', icon: LayoutDashboard },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/training', label: 'Entrenamiento IA', icon: Brain },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/customers', label: 'Clientes', icon: Users },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const logout = () => { localStorage.removeItem('chatcomercial_token'); window.location.href = '/login'; };
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">ChatComercial</h1>
        <p className="text-xs text-slate-500 mt-1">Omnicanal + IA</p>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-slate-200">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 w-full">
          <LogOut size={18} /> Salir
        </button>
      </div>
    </aside>
  );
}