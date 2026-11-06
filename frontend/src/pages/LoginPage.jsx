import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';

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
    catch (err) { setError(err.message || 'Email or password didn\'t match — please try again.'); }
    finally { setSubmitting(false); }
  };
  return (
    <main className="auth-page">
      <div className="fb-card auth-card">
        <div className="auth-intro">
          <h1>Sign in</h1>
          <p>New to FoodBridge? <Link to="/register">Create an account</Link></p>
        </div>
        <section aria-label="Sign in">
          <form onSubmit={e => { e.preventDefault(); signIn(email, password); }}>
            <Field
              id="login-email"
              label="Email address"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Field
              id="login-password"
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button type="submit" variant="primary" className="auth-submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
            {error && <p className="fb-field-error auth-form-error" role="alert">{error}</p>}
          </form>
          <details className="auth-demo">
            <summary>Try a demo account</summary>
            <p className="auth-demo-note">These shared accounts require demo data to be available.</p>
            <div className="auth-demo-actions">
              {demoAccounts.map(([role, address, secret]) => (
                <Button
                  key={role}
                  type="button"
                  variant="secondary"
                  disabled={submitting}
                  onClick={() => { setEmail(address); setPassword(secret); signIn(address, secret); }}
                >
                  {role}
                </Button>
              ))}
            </div>
          </details>
        </section>
      </div>
    </main>
  );
}
