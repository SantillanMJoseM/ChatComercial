'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

type NavItem = { href: string; label: string };
type NavGroup = { title: string; items: NavItem[] };

const groups: NavGroup[] = [
  { title: 'Inicio', items: [{ href: '/dashboard', label: 'Dashboard' }] },
  { title: 'Gestión comercial', items: [
    { href: '/clients', label: 'Clientes' },
    { href: '/contacts', label: 'Contactos' },
    { href: '/segments', label: 'Segmentaciones' },
    { href: '/whatsapp-groups', label: 'Grupos WhatsApp' },
  ]},
  { title: 'Atención', items: [
    { href: '/conversations', label: 'Conversaciones' },
    { href: '/assignments', label: 'Asignaciones' },
    { href: '/operators', label: 'Operadores' },
    { href: '/teams', label: 'Equipos' },
    { href: '/metrics', label: 'Métricas' },
  ]},
  { title: 'Inteligencia artificial', items: [
    { href: '/ai', label: 'Proveedores y asistentes' },
    { href: '/ai/playground', label: 'Pruebas de asistentes' },
    { href: '/knowledge', label: 'Conocimiento / RAG' },
    { href: '/skills', label: 'Skills' },
    { href: '/ai/audit', label: 'Auditoría IA' },
    { href: '/ai/feedback', label: 'Feedback IA' },
    { href: '/ai/metrics', label: 'Métricas IA' },
  ]},
  { title: 'Automatización', items: [
    { href: '/automations', label: 'Automatizaciones' },
    { href: '/automations/builder', label: 'Constructor visual' },
    { href: '/automations/supervision', label: 'Supervisión' },
  ]},
  { title: 'Analítica', items: [
    { href: '/reports', label: 'Reportes' },
  ]},
  { title: 'Administración', items: [
    { href: '/users', label: 'Usuarios' },
    { href: '/integrations', label: 'Integraciones' },
    { href: '/settings', label: 'Configuración' },
    { href: '/system', label: 'Estado del sistema' },
    { href: '/profile', label: 'Perfil' },
  ]},
  { title: 'Ayuda', items: [
    { href: '/help', label: 'Centro de ayuda' },
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

  if (!ready) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen flex">
      <aside className={`${collapsed ? 'w-16' : 'w-64'} border-r border-border bg-card p-3 hidden md:block transition-all`}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold">{collapsed ? 'CAP' : 'CAP'}</span>
          <button onClick={() => setCollapsed(!collapsed)} className="text-xs text-muted-foreground">{collapsed ? '»' : '«'}</button>
        </div>
        <nav className="space-y-2">
          {groups.map((g) => (
            <div key={g.title}>
              {!collapsed && (
                <button onClick={() => setOpenGroups({ ...openGroups, [g.title]: !openGroups[g.title] })} className="w-full text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1">
                  {g.title}
                </button>
              )}
              {openGroups[g.title] || collapsed ? (
                <div className="space-y-0.5">
                  {g.items.map((n) => (
                    <Link key={n.href} href={n.href} title={n.label} className={`block px-3 py-2 rounded-md text-sm ${pathname === n.href ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                      {collapsed ? n.label.slice(0, 2) : n.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>
        <button onClick={logout} className="mt-8 text-sm text-muted-foreground hover:text-foreground">{collapsed ? '×' : 'Cerrar sesión'}</button>
      </aside>
      <main className="flex-1 p-6">
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{groups.flatMap(g=>g.items).find(n=>n.href===pathname)?.label || ''}</h2>
          <span className="text-sm text-muted-foreground">{user?.email}</span>
        </header>
        {children}
      </main>
    </div>
  );
}
