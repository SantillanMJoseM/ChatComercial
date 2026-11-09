import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft w-full max-w-lg max-h-[90vh] overflow-auto border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="p-5 text-slate-700 dark:text-slate-200">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}