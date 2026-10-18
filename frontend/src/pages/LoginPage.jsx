import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Utensils, HeartHandshake, Recycle, Truck, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const user = await login(email, password);
      redirectByRole(user.role);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const redirectByRole = (role) => {
    switch (role) {
      case 'admin': navigate('/admin'); break;
      case 'donor': navigate('/donor'); break;
      case 'recipient': navigate('/recipient'); break;
      case 'recycler': navigate('/recycler'); break;
      case 'volunteer': navigate('/volunteer'); break;
      default: navigate('/'); break;
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setSubmitting(true);
    setError('');

    try {
      const user = await login(demoEmail, demoPassword);
      redirectByRole(user.role);
    } catch (err) {
      setError(err.message || 'Demo login failed. Make sure backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '520px', margin: '40px auto' }}>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            Sign In to FoodBridge
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Access your role-based dashboard and active surplus workflows
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '13px',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="user@foodbridge.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'} <ArrowRight size={15} />
          </button>
        </form>

        {/* 1-Click Demo Login Shortcuts for Evaluation */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '12px' }}>
            <Sparkles size={14} color="#059669" />
            <span>1-Click Fast Demo Logins (Viva & Testing):</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@foodbridge.com', 'admin123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}
              disabled={submitting}
            >
              <ShieldCheck size={14} /> Admin Portal
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('cinnamon@hotel.com', 'user123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
              disabled={submitting}
            >
              <Utensils size={14} /> Food Donor
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('carehome@ngo.org', 'user123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
              disabled={submitting}
            >
              <HeartHandshake size={14} /> NGO Recipient
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('info@ecocycle.lk', 'user123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
              disabled={submitting}
            >
              <Recycle size={14} /> Recycler
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: '#059669', fontWeight: '600', textDecoration: 'none' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
