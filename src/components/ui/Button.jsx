import React from 'react';

export default function Button({ children, onClick, variant='primary', className='', type='button', disabled=false, size='md' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-soft',
    secondary: 'bg-white dark:bg-slate-800 dark:bg-slate-800 text-slate-700 dark:text-slate-200 dark:text-slate-200 border border-slate-200 dark:border-slate-700 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}