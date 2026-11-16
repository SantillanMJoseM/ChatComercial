'use client';
import { useState } from 'react';
import { helpArticles, searchArticles } from '@/lib/help-content';
import { PageHeader } from '@/components/ui/page-header';

export default function HelpPage() {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const results = q.trim() ? searchArticles(q) : helpArticles;
  const article = selected ? helpArticles.find((a) => a.id === selected) : null;

  const categories = Array.from(new Set(helpArticles.map((a) => a.category)));

  return (
    <div className="space-y-6">
      <PageHeader title="Centro de ayuda" description="Documentación funcional de la plataforma. Buscá un módulo o tema." />
      <input className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-800 text-slate-200 text-sm" placeholder="Buscar en la ayuda..." value={q} onChange={(e) => setQ(e.target.value)} />

      {article ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <button onClick={() => setSelected(null)} className="text-indigo-400 text-sm hover:underline">← Volver</button>
          <h2 className="text-xl font-bold text-slate-100">{article.title}</h2>
          <p className="text-sm text-slate-400">{article.summary}</p>
          <div><h3 className="font-semibold text-slate-200">¿Para qué sirve?</h3><p className="text-sm text-slate-300">{article.purpose}</p></div>
          <div><h3 className="font-semibold text-slate-200">¿Quién puede utilizarlo?</h3><p className="text-sm text-slate-300">{article.who}</p></div>
          <div><h3 className="font-semibold text-slate-200">¿Cómo se utiliza?</h3><ul className="text-sm text-slate-300 list-disc list-inside">{article.how.map((h, i) => <li key={i}>{h}</li>)}</ul></div>
          <div><h3 className="font-semibold text-slate-200">Configuración</h3><ul className="text-sm text-slate-300 list-disc list-inside">{article.config.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
          <div><h3 className="font-semibold text-slate-200">Requisitos previos</h3><ul className="text-sm text-slate-300 list-disc list-inside">{article.prereq.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
          <div><h3 className="font-semibold text-slate-200">Errores frecuentes</h3><ul className="text-sm text-slate-300 list-disc list-inside">{article.errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>
          <div><h3 className="font-semibold text-slate-200">Buenas prácticas</h3><ul className="text-sm text-slate-300 list-disc list-inside">{article.tips.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
          <div><h3 className="font-semibold text-slate-200">Artículos relacionados</h3><div className="flex gap-2 flex-wrap">{article.related.map((r) => <button key={r} onClick={() => setSelected(r)} className="text-xs text-indigo-400 hover:underline">{r}</button>)}</div></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((cat) => (
            <div key={cat} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="font-semibold text-slate-100 mb-2">{cat}</h3>
              <ul className="text-sm space-y-1">
                {results.filter((a) => a.category === cat).map((a) => (
                  <li key={a.id}><button onClick={() => setSelected(a.id)} className="text-indigo-400 hover:underline text-left">{a.title}</button><span className="text-slate-500 text-xs ml-2">{a.summary}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-sm">
        <h3 className="font-semibold text-slate-100 mb-2">Circuitos operativos</h3>
        <ul className="space-y-1 text-slate-400">
          <li>• Circuito A — Atención comercial: Cliente → Contacto → Conversación → Bandeja → Operador → Resolución.</li>
          <li>• Circuito B — WhatsApp: Vinculación WAHA → Sesión → QR → Dispositivo conectado → Mensajes → Integración con Chatwoot → Plataforma.</li>
          <li>• Circuito C — IA: Proveedor → Modelo → Asistente → Instrucciones → Prueba → Conversación.</li>
          <li>• Circuito D — Conocimiento: Documento → Procesamiento → Embeddings → Índice → Recuperación → RAG → Respuesta fundamentada → Citas.</li>
          <li>• Circuito E — Skills: Creación → Versionado → Publicación → Vinculación → Ejecución → Aprobación → Auditoría.</li>
          <li>• Circuito F — Automatizaciones: Disparador → Evento → Condiciones → Acciones → Aprobación → Ejecución → Registro → Reporte.</li>
          <li>• Circuito G — Reportes: Origen de datos → Métricas → Filtros → Reporte → Exportación.</li>
        </ul>
      </div>
    </div>
  );
}
