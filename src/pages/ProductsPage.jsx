import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Upload, Download, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { money } from '../utils/format';
import Papa from 'papaparse';

export default function ProductsPage() {
  const { products, createProduct, updateProduct, deleteProduct } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: 0, stock: 0, category: '', imageUrl: '', isCustomDimensions: false, sku: '' });
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: 0, stock: 0, category: '', imageUrl: '', isCustomDimensions: false, sku: '' });
    setModalOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...p });
    setModalOpen(true);
  };

  const save = async () => {
    if (editing) await updateProduct(editing.id, form);
    else await createProduct(form);
    setModalOpen(false);
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      if (file.name.endsWith('.json')) {
        try {
          const data = JSON.parse(text);
          const arr = Array.isArray(data) ? data : data.products || [];
          for (const p of arr) await createProduct(normalizeProduct(p));
          alert(`Importados ${arr.length} productos`);
        } catch { alert('JSON inválido'); }
      } else {
        Papa.parse(text, {
          header: true,
          complete: async (res) => {
            for (const row of res.data) {
              if (!row.name) continue;
              await createProduct(normalizeProduct(row));
            }
            alert(`Importados ${res.data.filter(r=>r.name).length} productos`);
          }
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const normalizeProduct = (p) => ({
    name: p.name || p.nombre || 'Sin nombre',
    description: p.description || p.descripcion || '',
    price: Number(p.price || p.precio || 0),
    stock: Number(p.stock || p.stock || 0),
    category: p.category || p.categoria || 'General',
    imageUrl: p.imageUrl || p.imagen || '',
    isCustomDimensions: p.isCustomDimensions === true || p.isCustomDimensions === 'true' || p.a_medida === 'true',
    sku: p.sku || p.codigo || '',
  });

  const handleUrlImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    // Simulated scraping: generate mock products based on URL
    setTimeout(async () => {
      const mock = [
        { name: 'Producto importado 1', description: 'Importado desde ' + importUrl, price: 15000, stock: 10, category: 'Importados', imageUrl: '', isCustomDimensions: false, sku: 'IMP-001' },
        { name: 'Producto importado 2', description: 'Importado desde ' + importUrl, price: 22000, stock: 5, category: 'Importados', imageUrl: '', isCustomDimensions: false, sku: 'IMP-002' },
      ];
      for (const p of mock) await createProduct(p);
      setImporting(false);
      alert('Importación simulada completada (2 productos)');
    }, 1200);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Productos</h2>
        <div className="flex gap-2">
          <Button onClick={openCreate}><Plus size={16}/> Nuevo</Button>
        </div>
      </div>

      {/* Import module */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6">
        <h3 className="font-semibold text-slate-700 mb-3">Importación masiva / Scraping simulado</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-slate-600">URL de e-commerce</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm" placeholder="https://tienda.com/categoria" value={importUrl} onChange={e=>setImportUrl(e.target.value)} />
          </div>
          <Button onClick={handleUrlImport} disabled={importing}>{importing ? 'Importando...' : 'Importar desde URL'}</Button>
          <Button variant="secondary" onClick={()=>fileRef.current?.click()}><Upload size={16}/> Cargar JSON/CSV</Button>
          <input ref={fileRef} type="file" accept=".json,.csv" hidden onChange={handleFileImport} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-32 object-cover rounded-xl mb-3" />}
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800">{p.name}</h4>
              {p.isCustomDimensions && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">A medida</span>}
            </div>
            <p className="text-xs text-slate-500 mt-1">{p.description}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="font-bold text-indigo-600">{money(p.price)}</span>
              <span className="text-xs text-slate-400">Stock: {p.stock}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="secondary" onClick={()=>openEdit(p)}>Editar</Button>
              <Button size="sm" variant="danger" onClick={()=>deleteProduct(p.id)}><Trash2 size={14}/></Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editing?'Editar producto':'Nuevo producto'}
        footer={<><Button variant="secondary" onClick={()=>setModalOpen(false)}>Cancelar</Button><Button onClick={save}>Guardar</Button></>}>
        <div className="space-y-3">
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Descripción" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" className="border border-slate-200 rounded-lg px-3 py-2" placeholder="Precio" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})} />
            <input type="number" className="border border-slate-200 rounded-lg px-3 py-2" placeholder="Stock" value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})} />
          </div>
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Categoría" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} />
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="URL imagen" value={form.imageUrl} onChange={e=>setForm({...form,imageUrl:e.target.value})} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.isCustomDimensions} onChange={e=>setForm({...form,isCustomDimensions:e.target.checked})} />
            Producto a medida (aberturas)
          </label>
        </div>
      </Modal>
    </div>
  );
}