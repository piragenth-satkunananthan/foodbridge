import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { loginAdmin, setAuthToken, saveUser } from '../api';

export default function LoginModal({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginAdmin(email, password);
      if (data.role !== 'admin') {
        throw new Error('Access denied: You must be an administrator to access this portal.');
      }
      setAuthToken(data.token);
      saveUser(data);
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials or start the backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('admin@foodbridge.com');
    setPassword('admin123');
    // Pre-set and submit
    setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await loginAdmin('admin@foodbridge.com', 'admin123');
        setAuthToken(data.token);
        saveUser(data);
        onLoginSuccess(data);
      } catch (err) {
        // If MongoDB isn't reachable, offer offline demo mode
        const demoAdmin = {
          _id: 'demo-admin-id',
          name: 'Demo Administrator',
          email: 'admin@foodbridge.com',
          role: 'admin',
          district: 'Colombo',
          verificationStatus: 'verified',
          token: 'demo-jwt-token'
        };
        setAuthToken(demoAdmin.token);
        saveUser(demoAdmin);
        onLoginSuccess(demoAdmin);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '440px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: 'white',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
            FoodBridge Admin
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Module 5 • Verification, Monitoring & Impact
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="admin@foodbridge.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
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
            style={{ width: '100%', padding: '10px', marginTop: '4px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In as Administrator'} <ArrowRight size={15} />
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          paddingTop: '18px',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn btn-secondary"
            style={{ width: '100%', background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}
            disabled={loading}
          >
            <Sparkles size={15} color="#16a34a" />
            <span>1-Click Quick Demo Login</span>
          </button>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
            Instant evaluation login (admin@foodbridge.com / admin123)
          </div>
        </div>
      </div>
    </div>
  );
}
