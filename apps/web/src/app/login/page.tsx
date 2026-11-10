'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Plataforma Integral de Atención Comercial</h1>
        <p className="text-muted-foreground mb-6">Iniciar sesión</p>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <label className="block mb-2 text-sm font-medium">Email</label>
        <input className="w-full mb-4 px-3 py-2 border border-border rounded-md bg-background" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <label className="block mb-2 text-sm font-medium">Contraseña</label>
        <input className="w-full mb-6 px-3 py-2 border border-border rounded-md bg-background" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        <button disabled={loading} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium disabled:opacity-50">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
