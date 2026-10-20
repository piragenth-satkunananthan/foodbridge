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
    <div className="main-content" style={{ maxWidth: '540px', margin: '48px auto' }}>
      <div className="card" style={{
        padding: '36px',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)',
        borderRadius: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            boxShadow: '0 8px 16px -4px rgba(5, 150, 105, 0.3)'
          }}>
            <ShieldCheck size={24} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Sign In to FoodBridge Console
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '6px' }}>
            Enterprise surplus logistics, KYC verification & ESG impact tracking
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '13px',
            padding: '11px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Work / Organizational Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-executive"
            style={{ width: '100%', padding: '12px', marginTop: '8px', fontSize: '14px' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight size={16} />
          </button>
        </form>

        {/* 1-Click Interactive Persona Switcher for Quick Exploration */}
        <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#059669" /> Demo Persona Quick-Switch:
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>1-Click Login</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@foodbridge.com', 'admin123')}
              className="persona-chip"
              disabled={submitting}
            >
              <div style={{ color: '#059669', display: 'flex' }}><ShieldCheck size={16} /></div>
              <div>
                <div>Platform Admin</div>
                <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '400' }}>Full Governance</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('cinnamon@hotel.com', 'user123')}
              className="persona-chip"
              disabled={submitting}
            >
              <div style={{ color: '#0284c7', display: 'flex' }}><Utensils size={16} /></div>
              <div>
                <div>Grand Hotel</div>
                <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '400' }}>Commercial Donor</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('carehome@ngo.org', 'user123')}
              className="persona-chip"
              disabled={submitting}
            >
              <div style={{ color: '#7c3aed', display: 'flex' }}><HeartHandshake size={16} /></div>
              <div>
                <div>Hope Haven NGO</div>
                <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '400' }}>Verified Recipient</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('info@ecocycle.lk', 'user123')}
              className="persona-chip"
              disabled={submitting}
            >
              <div style={{ color: '#0d9488', display: 'flex' }}><Recycle size={16} /></div>
              <div>
                <div>EcoCycle Bio</div>
                <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '400' }}>Circular Recycler</div>
              </div>
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          Need to onboard your organization?{' '}
          <Link to="/register" style={{ color: '#059669', fontWeight: '700', textDecoration: 'none' }}>
            Register Organization
          </Link>
        </div>
      </div>
    </div>
  );
}
