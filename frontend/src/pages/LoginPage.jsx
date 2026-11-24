import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const signIn = async (address, secret) => {
    setSubmitting(true);
    setError('');
    try { const user = await login(address, secret); navigate(from?.startsWith(`/${user.role}`) ? from : `/${user.role}`); }
    catch (err) { setError(err.message || 'Email or password didn\'t match — please try again.'); }
    finally { setSubmitting(false); }
  };
  return (
    <main id="main" className="auth-page">
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
        </section>
      </div>
    </main>
  );
}
