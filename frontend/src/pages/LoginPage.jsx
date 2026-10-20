import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Utensils, HeartHandshake, Recycle, Truck, ArrowRight, Sparkles, Lock } from 'lucide-react';

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
    <div className="plaid-grid-bg" style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '520px' }}
      >
        <div className="plaid-card" style={{
          padding: '40px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          borderRadius: '20px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.4 }}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 8px 18px -4px rgba(5, 150, 105, 0.35)'
              }}
            >
              <ShieldCheck size={26} />
            </motion.div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em' }}>
              Sign In to FoodBridge Console
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '6px' }}>
              Enterprise surplus logistics, KYC verification & ESG impact tracking
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '13px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  fontWeight: '500'
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Work / Organizational Email
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  borderRadius: '10px',
                  padding: '11px 14px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  transition: 'all 0.15s ease'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                  Password
                </label>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  borderRadius: '10px',
                  padding: '11px 14px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  transition: 'all 0.15s ease'
                }}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="plaid-btn-emerald"
              style={{ width: '100%', padding: '13px', fontSize: '14.5px' }}
              disabled={submitting}
            >
              {submitting ? 'Authenticating Credentials...' : 'Sign In to Portal'}
              <ArrowRight size={16} />
            </motion.button>
          </form>

          {/* 1-Click Interactive Persona Switcher */}
          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#059669" /> Demo Persona Quick-Switch:
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>1-Click Instant Demo</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <motion.button
                whileHover={{ y: -2, borderColor: '#10b981' }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleDemoLogin('admin@foodbridge.com', 'admin123')}
                className="persona-chip"
                disabled={submitting}
                style={{ borderRadius: '12px', padding: '10px 12px' }}
              >
                <div style={{ color: '#059669', display: 'flex' }}><ShieldCheck size={18} /></div>
                <div>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>Platform Admin</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Full ESG Governance</div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ y: -2, borderColor: '#0284c7' }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleDemoLogin('cinnamon@hotel.com', 'user123')}
                className="persona-chip"
                disabled={submitting}
                style={{ borderRadius: '12px', padding: '10px 12px' }}
              >
                <div style={{ color: '#0284c7', display: 'flex' }}><Utensils size={18} /></div>
                <div>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>Grand Hotel</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Commercial Food Donor</div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ y: -2, borderColor: '#7c3aed' }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleDemoLogin('carehome@ngo.org', 'user123')}
                className="persona-chip"
                disabled={submitting}
                style={{ borderRadius: '12px', padding: '10px 12px' }}
              >
                <div style={{ color: '#7c3aed', display: 'flex' }}><HeartHandshake size={18} /></div>
                <div>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>Hope Haven NGO</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Verified Recipient</div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ y: -2, borderColor: '#0d9488' }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleDemoLogin('info@ecocycle.lk', 'user123')}
                className="persona-chip"
                disabled={submitting}
                style={{ borderRadius: '12px', padding: '10px 12px' }}
              >
                <div style={{ color: '#0d9488', display: 'flex' }}><Recycle size={18} /></div>
                <div>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>EcoCycle Bio</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Circular Recycler</div>
                </div>
              </motion.button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '26px', fontSize: '13px', color: '#64748b' }}>
            Need to onboard your organization?{' '}
            <Link to="/register" style={{ color: '#059669', fontWeight: '700', textDecoration: 'none' }}>
              Register Organization
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
