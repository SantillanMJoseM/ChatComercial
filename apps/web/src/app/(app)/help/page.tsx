'use client';
import { useState } from 'react';

const categories = [
  { title: 'Inicio', items: ['Dashboard', 'Resumen operativo'] },
  { title: 'Gestión comercial', items: ['Clientes y contactos', 'Segmentaciones', 'Grupos de WhatsApp'] },
  { title: 'Atención', items: ['Conversaciones', 'Bandejas', 'Operadores', 'Equipos', 'Supervisión'] },
  { title: 'Inteligencia artificial', items: ['Proveedores', 'Modelos', 'Asistentes', 'Pruebas de asistentes', 'Conocimiento / RAG', 'Skills', 'Ejecuciones de IA'] },
  { title: 'Automatización', items: ['Automatizaciones', 'Constructor visual', 'Disparadores y condiciones', 'Acciones', 'Aprobaciones y supervisión', 'Historial de ejecuciones'] },
  { title: 'Analítica', items: ['Reportes', 'Métricas comerciales', 'Métricas de atención', 'Métricas de IA', 'Métricas de automatizaciones'] },
  { title: 'Administración', items: ['Usuarios', 'Roles y permisos', 'Equipos', 'Integraciones', 'Auditoría', 'Configuración general'] },
];

export default function HelpPage() {
  const [q, setQ] = useState('');
  const filtered = categories.map((c) => ({ ...c, items: c.items.filter((i) => i.toLowerCase().includes(q.toLowerCase())) })).filter((c) => c.items.length > 0 || q === '');
  return (
    <div className="space-y-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-2">Centro de ayuda</h2>
        <p className="text-sm text-slate-300 mb-4">Documentación funcional de la plataforma. Buscá un módulo o tema.</p>
        <input className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700/50" placeholder="Buscar en la ayuda..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((c) => (
          <div key={c.title} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="font-semibold mb-2">{c.title}</h3>
            <ul className="text-sm space-y-1">
              {c.items.map((i) => <li key={i} className="text-slate-300">• {i}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-sm">
        <h3 className="font-semibold mb-2">Circuitos operativos</h3>
        <ul className="space-y-1 text-slate-300">
          <li>• Circuito A — Atención comercial: Cliente → Contacto → Conversación → Bandeja → Operador → Resolución.</li>
          <li>• Circuito B — WhatsApp: Vinculación WAHA → Sesión → QR → Dispositivo conectado → Mensajes → Integración con Chatwoot → Plataforma.</li>
          <li>• Circuito C — IA: Proveedor → Modelo → Asistente → Instrucciones → Prueba → Conversación.</li>
          <li>• Circuito D — Conocimiento: Documento → Procesamiento → Embeddings → Índice → Recuperación → RAG → Respuesta fundamentada → Citas.</li>
          <li>• Circuito E — Skills: Creación → Versionado → Publicación → Vinculación → Ejecución → Aprobación → Auditoría.</li>
          <li>• Circuito F — Automatizaciones: Disparador → Evento → Condiciones → Acciones → Aprobación → Ejecución → Registro → Reporte.</li>
          <li>• Circuito G — Reportes: Origen de datos → Métricas → Filtros → Reporte → Exportación.</li>
        </ul>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-sm">
        <h3 className="font-semibold mb-2">Guía de configuración inicial</h3>
        <ol className="list-decimal list-inside space-y-1 text-slate-300">
          <li>Administrador y usuarios.</li>
          <li>Roles y permisos.</li>
          <li>Equipos y operadores.</li>
          <li>Integración Chatwoot.</li>
          <li>Integración WAHA.</li>
          <li>Proveedores de IA.</li>
          <li>Modelos.</li>
          <li>Asistentes.</li>
          <li>Embeddings.</li>
          <li>Base de conocimiento.</li>
          <li>Skills.</li>
          <li>Automatizaciones.</li>
          <li>Reportes.</li>
        </ol>
      </div>
    </div>
  );
}
