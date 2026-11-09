import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export default function LoginPage() {
  const [email, setEmail] = useState('admin@chatcomercial.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) { setError('Credenciales inválidas'); return; }
    const data = await res.json();
    localStorage.setItem('chatcomercial_token', data.token);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-800">
      <form onSubmit={submit} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ChatComercial</h1>
        <input className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <Button type="submit" className="w-full">Ingresar</Button>
      </form>
    </div>
  );
}