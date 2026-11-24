import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../lib/format';
import PublicLayout from '../components/PublicLayout';
import { Button, ErrorState, Field } from '../components/ui';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(form.email, form.password);
      const home = ROLE_HOME[u.role] || '/';
      navigate(from?.startsWith(home) ? from : home);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <PublicLayout>
      <div className="auth-wrap">
        <div className="card auth-card">
          <p className="eyebrow">Welcome back</p>
          <h1 className="text-4xl mt-2">Sign in to your desk</h1>
          <p className="muted mt-1 mb-6">New to FoodBridge? <Link to="/register" className="font-semibold text-[var(--leaf)] underline underline-offset-4">Create an account</Link></p>
          <form onSubmit={submit} className="grid gap-4">
            {error && <ErrorState message={error} />}
            <Field label="Email"><input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Password"><input className="input" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <Button type="submit" size="lg" icon={LogIn} loading={busy}>Sign in</Button>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
}
