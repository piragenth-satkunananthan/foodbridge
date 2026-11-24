import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Bike, HandHeart, Recycle, UserPlus, Utensils } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DISTRICTS, ROLE_HOME } from '../lib/format';
import PublicLayout from '../components/PublicLayout';
import { Button, ErrorState, Field } from '../components/ui';

const ROLES = [
  ['donor', Utensils, 'Donor', 'I have surplus food or waste'],
  ['recipient', HandHeart, 'Recipient', 'NGO, charity or shelter'],
  ['volunteer', Bike, 'Volunteer', 'I can carry pickups'],
  ['recycler', Recycle, 'Recycler', 'Recycling, composting or disposal']
];

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = ROLES.some(([r]) => r === params.get('role')) ? params.get('role') : 'donor';
  const [form, setForm] = useState({ name: '', email: '', password: '', role: initialRole, district: 'Colombo', contactNumber: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const isOrg = form.role === 'recipient' || form.role === 'recycler';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await register(form);
      // Organisations go straight to their profile: verification needs it.
      navigate(`${ROLE_HOME[u.role]}${isOrg ? '/profile' : ''}`);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <PublicLayout>
      <div className="auth-wrap">
        <div className="card auth-card" style={{ width: 'min(640px, 100%)' }}>
          <h1 className="text-2xl">Create your account</h1>
          <p className="muted mt-1 mb-6">Already registered? <Link to="/login" className="font-semibold text-[var(--primary)] underline underline-offset-4">Sign in</Link></p>
          <form onSubmit={submit} className="grid gap-5">
            {error && <ErrorState message={error} />}
            <fieldset className="grid gap-2 border-0 p-0 m-0">
              <legend className="text-sm font-semibold mb-2">I am joining as</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {ROLES.map(([value, Icon, title, text]) => (
                  <label key={value} className="choice" style={{ alignItems: 'flex-start', padding: 12 }}>
                    <input type="radio" name="role" value={value} checked={form.role === value} onChange={set('role')} className="sr-only" />
                    <Icon size={20} aria-hidden="true" style={{ marginTop: 2 }} />
                    <span><span className="block">{title}</span><span className="block text-xs font-medium muted">{text}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            {isOrg && <div className="alert">After sign-up you'll complete your organisation profile. An administrator verifies it before you can claim posts.</div>}
            <div className="form-grid">
              <Field label={isOrg ? 'Contact person name' : 'Full name or business name'}><input className="input" autoComplete="name" required maxLength={200} value={form.name} onChange={set('name')} /></Field>
              <Field label="Phone number"><input className="input" type="tel" autoComplete="tel" required maxLength={50} value={form.contactNumber} onChange={set('contactNumber')} /></Field>
              <Field label="Email"><input className="input" type="email" autoComplete="email" required value={form.email} onChange={set('email')} /></Field>
              <Field label="District"><select className="input" value={form.district} onChange={set('district')}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
            </div>
            <Field label="Password" hint="At least 8 characters."><input className="input" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} /></Field>
            <Button type="submit" size="lg" icon={UserPlus} loading={busy}>Create account</Button>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
}
