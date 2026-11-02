import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const demoAccounts = [
  ['Admin', 'admin@foodbridge.com', 'admin123'],
  ['Donor', 'cinnamon@hotel.com', 'user123'],
  ['Recipient', 'carehome@ngo.org', 'user123'],
  ['Recycler', 'info@ecocycle.lk', 'user123'],
  ['Volunteer', 'saman@volunteer.org', 'user123']
];
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const signIn = async (address, secret) => {
    setSubmitting(true);
    setError('');
    try { const user = await login(address, secret); navigate(`/${user.role}`); }
    catch (err) { setError(err.message || 'Sign-in failed. Please try again.'); }
    finally { setSubmitting(false); }
  };
  return <main className="auth-layout">
    <div className="auth-intro"><h1>Sign in</h1><p>New to FoodBridge? <Link to="/register">Create an account</Link></p></div>
    <section className="auth-form" aria-label="Sign in">
      {error && <p className="report-error" role="alert">{error}</p>}
      <form onSubmit={e => { e.preventDefault(); signIn(email, password); }}>
        <label htmlFor="login-email">Email address</label>
        <input id="login-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
        <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <details className="demo-accounts"><summary>Try a demo account</summary><p>These shared accounts require demo data to be available.</p><div className="report-actions">{demoAccounts.map(([role, address, secret]) => <button key={role} type="button" className="btn btn-secondary" disabled={submitting} onClick={() => { setEmail(address); setPassword(secret); signIn(address, secret); }}>{role}</button>)}</div></details>
    </section>
  </main>;
}
