'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

type NavItem = { href: string; label: string; icon: string };
type NavGroup = { title: string; icon: string; items: NavItem[] };

const groups: NavGroup[] = [
  { title: 'INICIO', icon: '🏠', items: [{ href: '/dashboard', label: 'Dashboard', icon: '📊' }] },
  { title: 'GESTIÓN COMERCIAL', icon: '💼', items: [
    { href: '/clients', label: 'Clientes', icon: '👥' },
    { href: '/contacts', label: 'Contactos', icon: '�' },
    { href: '/segments', label: 'Segmentaciones', icon: '🎯' },
    { href: '/whatsapp-groups', label: 'Grupos WhatsApp', icon: '📱' },
  ]},
  { title: 'ATENCIÓN', icon: '🎧', items: [
    { href: '/conversations', label: 'Conversaciones', icon: '💬' },
    { href: '/assignments', label: 'Asignaciones', icon: '🔄' },
    { href: '/operators', label: 'Operadores', icon: '👤' },
    { href: '/teams', label: 'Equipos', icon: '👥' },
    { href: '/metrics', label: 'Métricas', icon: '📈' },
  ]},
  { title: 'INTELIGENCIA ARTIFICIAL', icon: '🤖', items: [
    { href: '/ai', label: 'Proveedores y asistentes', icon: '🧠' },
    { href: '/ai/playground', label: 'Pruebas de asistentes', icon: '🧪' },
    { href: '/knowledge', label: 'Conocimiento / RAG', icon: '📚' },
    { href: '/skills', label: 'Skills', icon: '⚡' },
    { href: '/ai/audit', label: 'Auditoría IA', icon: '🔍' },
    { href: '/ai/feedback', label: 'Feedback IA', icon: '📝' },
    { href: '/ai/metrics', label: 'Métricas IA', icon: '📊' },
  ]},
  { title: 'AUTOMATIZACIÓN', icon: '⚙️', items: [
    { href: '/automations', label: 'Automatizaciones', icon: '🔄' },
    { href: '/automations/builder', label: 'Constructor visual', icon: '🛠️' },
    { href: '/automations/supervision', label: 'Supervisión', icon: '👁️' },
  ]},
  { title: 'ANALÍTICA', icon: '📊', items: [
    { href: '/reports', label: 'Reportes', icon: '📈' },
  ]},
  { title: 'ADMINISTRACIÓN', icon: '🔧', items: [
    { href: '/users', label: 'Usuarios', icon: '👥' },
    { href: '/integrations', label: 'Integraciones', icon: '🔗' },
    { href: '/settings', label: 'Configuración', icon: '⚙️' },
    { href: '/system', label: 'Estado del sistema', icon: '🖥️' },
    { href: '/profile', label: 'Perfil', icon: '👤' },
  ]},
  { title: 'AYUDA', icon: '❓', items: [
    { href: '/help', label: 'Centro de ayuda', icon: '📖' },
  ]},
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    groups.forEach((g) => { init[g.title] = true; });
    return init;
  });

  useEffect(() => {
    apiFetch('/api/v1/auth/me').then((u) => { setUser(u); setReady(true); }).catch(() => { router.push('/login'); });
  }, [router]);

  async function logout() {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
  }

  if (!ready) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Cargando...</div>;

  const activeLabel = groups.flatMap(g => g.items).find(n => n.href === pathname)?.label || '';

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-[#151E32] text-white flex flex-col transition-all duration-200 hidden md:flex`}>
        <div className="px-4 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-sm">C</div>
            {!collapsed && <div><div className="font-semibold text-sm">CAP</div><div className="text-[10px] text-slate-400">Atención Comercial</div></div>}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white text-xs">{collapsed ? '»' : '«'}</button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {groups.map((g) => (
            <div key={g.title} className="mb-2">
              {!collapsed && (
                <button onClick={() => setOpenGroups({ ...openGroups, [g.title]: !openGroups[g.title] })} className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200">
                  <span>{g.icon}</span><span>{g.title}</span><span className="ml-auto">{openGroups[g.title] ? '▾' : '▸'}</span>
                </button>
              )}
              {(openGroups[g.title] || collapsed) && (
                <div className="space-y-0.5 mt-1">
                  {g.items.map((n) => {
                    const active = pathname === n.href;
                    return (
                      <Link key={n.href} href={n.href} title={n.label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                        <span className="text-base w-5 text-center">{n.icon}</span>
                        {!collapsed && <span className="truncate">{n.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-white/10">
          <button onClick={logout} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm w-full px-3 py-2 rounded-lg hover:bg-white/10">
            <span>🚪</span>{!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">CAP / {groups.flatMap(g=>g.items).find(n=>n.href===pathname)?.label || ''}</div>
            <h1 className="text-lg font-semibold text-slate-800">{activeLabel}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">{user?.name?.[0] || 'A'}</div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
