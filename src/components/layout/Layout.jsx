import React from 'react';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export default function Layout({ children }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 px-8 flex items-center justify-between bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400">ChatComercial</div>
          <button onClick={toggle} className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}