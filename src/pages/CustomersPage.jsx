import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

export default function CustomersPage() {
  const { customers, createCustomer, updateCustomer, deleteCustomer } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', branchLocation: '', botEnabled: true, notes: '' });

  const openCreate = () => { setEditing(null); setForm({ name: '', phone: '', email: '', branchLocation: '', botEnabled: true, notes: '' }); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c }); setModalOpen(true); };
  const save = async () => {
    if (editing) await updateCustomer(editing.id, form);
    else await createCustomer(form);
    setModalOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
        <Button onClick={openCreate}><Plus size={16}/> Nuevo</Button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Teléfono</th>
              <th className="text-left px-4 py-3">Sucursal</th>
              <th className="text-left px-4 py-3">Bot</th>
              <th className="text-left px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">{c.phone}</td>
                <td className="px-4 py-3 text-slate-500">{c.branchLocation}</td>
                <td className="px-4 py-3">
                  <button onClick={()=>updateCustomer(c.id,{botEnabled:!c.botEnabled})}
                    className={`text-xs px-2 py-1 rounded-full ${c.botEnabled?'bg-emerald-100 text-emerald-700':'bg-slate-200 text-slate-600'}`}>
                    {c.botEnabled?'Activo':'Desactivado'}
                  </button>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={()=>openEdit(c)} className="text-indigo-600 text-xs hover:underline">Editar</button>
                  <button onClick={()=>deleteCustomer(c.id)} className="text-red-600 text-xs hover:underline"><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editing?'Editar cliente':'Nuevo cliente'}
        footer={<><Button variant="secondary" onClick={()=>setModalOpen(false)}>Cancelar</Button><Button onClick={save}>Guardar</Button></>}>
        <div className="space-y-3">
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Teléfono" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Sucursal" value={form.branchLocation} onChange={e=>setForm({...form,branchLocation:e.target.value})} />
          <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Notas" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.botEnabled} onChange={e=>setForm({...form,botEnabled:e.target.checked})} />
            Bot habilitado para este cliente
          </label>
        </div>
      </Modal>
    </div>
  );
}