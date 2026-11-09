import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday:'Lunes', tuesday:'Martes', wednesday:'Miércoles', thursday:'Jueves', friday:'Viernes', saturday:'Sábado', sunday:'Domingo' };

export default function SettingsPage() {
  const { settings, updateSettings, statuses, createStatus, updateStatus, deleteStatus, reorderStatuses } = useApp();
  const [statusModal, setStatusModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusForm, setStatusForm] = useState({ name: '', color: '#6366f1' });

  if (!settings) return <div>Cargando...</div>;

  const openStatusCreate = () => { setEditingStatus(null); setStatusForm({ name: '', color: '#6366f1' }); setStatusModal(true); };
  const openStatusEdit = (s) => { setEditingStatus(s); setStatusForm({ name: s.name, color: s.color }); setStatusModal(true); };
  const saveStatus = async () => {
    if (editingStatus) await updateStatus(editingStatus.id, statusForm);
    else await createStatus(statusForm);
    setStatusModal(false);
  };

  const moveStatus = async (idx, dir) => {
    const arr = [...statuses];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    await reorderStatuses(arr.map(s => s.id));
  };

  const updateSchedule = (day, patch) => {
    const weeklySchedule = { ...settings.weeklySchedule, [day]: { ...settings.weeklySchedule[day], ...patch } };
    updateSettings({ weeklySchedule });
  };

  const toggleTone = (key) => {
    const toneRules = { ...settings.toneRules, [key]: !settings.toneRules[key] };
    updateSettings({ toneRules });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Configuración</h2>

      {/* Statuses */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">Estados de pedidos (Kanban)</h3>
          <Button size="sm" onClick={openStatusCreate}><Plus size={14}/> Nuevo estado</Button>
        </div>
        <div className="space-y-2">
          {statuses.map((s, idx) => (
            <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="font-medium text-slate-700">{s.name}</span>
                {s.is_system_default && <span className="text-[10px] text-slate-400">(sistema)</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>moveStatus(idx,-1)} className="p-1 text-slate-400 hover:text-slate-700"><ArrowUp size={14}/></button>
                <button onClick={()=>moveStatus(idx,1)} className="p-1 text-slate-400 hover:text-slate-700"><ArrowDown size={14}/></button>
                <button onClick={()=>openStatusEdit(s)} className="text-xs text-indigo-600 hover:underline">Editar</button>
                {!s.is_system_default && <button onClick={()=>deleteStatus(s.id)} className="text-xs text-red-600 hover:underline"><Trash2 size={14}/></button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attention schedule */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-700 mb-4">Reglas de atención y horarios</h3>
        <div className="flex items-center justify-between mb-4 p-3 bg-amber-50 rounded-xl">
          <div>
            <div className="font-medium text-slate-700">Modo Ausente / Cierre Temporal</div>
            <div className="text-xs text-slate-500">Fuerza respuestas fuera de horario</div>
          </div>
          <button onClick={()=>updateSettings({ outOfHours: !settings.outOfHours })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${settings.outOfHours?'bg-amber-600 text-white':'bg-slate-200 text-slate-600'}`}>
            {settings.outOfHours ? 'Activado' : 'Desactivado'}
          </button>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-600">Modo de respuesta global del bot</span>
          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={settings.botResponseMode} onChange={e=>updateSettings({ botResponseMode: e.target.value })}>
            <option value="auto">Automático</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-600">Bot global habilitado</span>
          <button onClick={()=>updateSettings({ globalBotEnabled: !settings.globalBotEnabled })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${settings.globalBotEnabled?'bg-emerald-600 text-white':'bg-slate-200 text-slate-600'}`}>
            {settings.globalBotEnabled ? 'Activo' : 'Desactivado'}
          </button>
        </div>
        <div className="space-y-2">
          {DAYS.map(day => {
            const cfg = settings.weeklySchedule[day];
            return (
              <div key={day} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2">
                <span className="w-24 text-sm font-medium text-slate-700">{DAY_LABELS[day]}</span>
                <button onClick={()=>updateSchedule(day, { enabled: !cfg.enabled })}
                  className={`text-xs px-2 py-1 rounded-full ${cfg.enabled?'bg-emerald-100 text-emerald-700':'bg-slate-200 text-slate-600'}`}>
                  {cfg.enabled?'Abierto':'Cerrado'}
                </button>
                {cfg.enabled && (
                  <>
                    <input type="time" className="border border-slate-200 rounded-lg px-2 py-1 text-sm" value={cfg.start} onChange={e=>updateSchedule(day,{start:e.target.value})} />
                    <span className="text-slate-400">a</span>
                    <input type="time" className="border border-slate-200 rounded-lg px-2 py-1 text-sm" value={cfg.end} onChange={e=>updateSchedule(day,{end:e.target.value})} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tone rules */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-700 mb-4">Reglas de tono natural</h3>
        <div className="space-y-3">
          {[
            { key: 'noOpeningQuestionMark', label: 'Omitir signos de apertura (¿)' },
            { key: 'noFinalPeriod', label: 'Omitir punto final en las oraciones' },
            { key: 'useDiscreteEmojis', label: 'Usar emojis/reacciones discretas' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2">
              <span className="text-sm text-slate-700">{label}</span>
              <button onClick={()=>toggleTone(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${settings.toneRules[key]?'bg-emerald-600 text-white':'bg-slate-200 text-slate-600'}`}>
                {settings.toneRules[key] ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <Modal open={statusModal} onClose={()=>setStatusModal(false)} title={editingStatus?'Editar estado':'Nuevo estado'}
        footer={<><Button variant="secondary" onClick={()=>setStatusModal(false)}>Cancelar</Button><Button onClick={saveStatus}>Guardar</Button></>}>
        <div className="space-y-3">
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Nombre del estado" value={statusForm.name} onChange={e=>setStatusForm({...statusForm,name:e.target.value})} />
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Color</label>
            <input type="color" value={statusForm.color} onChange={e=>setStatusForm({...statusForm,color:e.target.value})} />
            <Badge color={statusForm.color}>{statusForm.name || 'Estado'}</Badge>
          </div>
        </div>
      </Modal>
    </div>
  );
}