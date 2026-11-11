'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/users', label: 'Usuarios' },
  { href: '/teams', label: 'Equipos' },
  { href: '/clients', label: 'Clientes' },
  { href: '/contacts', label: 'Contactos' },
  { href: '/operators', label: 'Operadores' },
  { href: '/conversations', label: 'Conversaciones' },
  { href: '/assignments', label: 'Asignaciones' },
  { href: '/metrics', label: 'Métricas' },
  { href: '/segments', label: 'Segmentos' },
  { href: '/consents', label: 'Consentimientos' },
  { href: '/whatsapp-groups', label: 'Grupos WA' },
  { href: '/chatwoot-teams', label: 'Equipos CW' },
  { href: '/ai', label: 'IA' },
  { href: '/settings', label: 'Configuración' },
  { href: '/integrations', label: 'Integraciones' },
  { href: '/system', label: 'Estado del sistema' },
  { href: '/profile', label: 'Perfil' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

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
      <aside className="w-64 border-r border-border bg-card p-4 hidden md:block">
        <div className="font-bold mb-6">CAP</div>
        <nav className="space-y-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={`block px-3 py-2 rounded-md text-sm ${pathname === n.href ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="mt-8 text-sm text-muted-foreground hover:text-foreground">Cerrar sesión</button>
      </aside>
      <main className="flex-1 p-6">
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{nav.find(n=>n.href===pathname)?.label || ''}</h2>
          <span className="text-sm text-muted-foreground">{user?.email}</span>
        </header>
        {children}
      </main>
    </div>
  );
}
