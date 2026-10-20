import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Building2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'donor',
    district: 'Colombo',
    contactNumber: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const user = await register(formData);
      switch (user.role) {
        case 'admin': navigate('/admin'); break;
        case 'donor': navigate('/donor'); break;
        case 'recipient': navigate('/recipient'); break;
        case 'recycler': navigate('/recycler'); break;
        case 'volunteer': navigate('/volunteer'); break;
        default: navigate('/'); break;
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
        style={{ width: '100%', maxWidth: '540px' }}
      >
        <div className="plaid-card" style={{
          padding: '40px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          borderRadius: '20px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
              <Building2 size={24} />
            </motion.div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em' }}>
              Join FoodBridge Network
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '6px' }}>
              Register as a verified food donor, recipient NGO, circular recycler, or volunteer
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

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Full Name or Organization Name
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Grand Cinnamon Hotel or Hope Charity"
                value={formData.name}
                onChange={handleChange}
                required
                style={{ borderRadius: '10px', padding: '11px 14px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="contact@org.com"
                value={formData.email}
                onChange={handleChange}
                required
                style={{ borderRadius: '10px', padding: '11px 14px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ borderRadius: '10px', padding: '11px 14px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Ecosystem Role
                </label>
                <select
                  name="role"
                  className="form-input"
                  value={formData.role}
                  onChange={handleChange}
                  style={{ borderRadius: '10px', padding: '11px 14px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}
                >
                  <option value="donor">Food Donor (Hotel / Restaurant)</option>
                  <option value="recipient">Food Recipient (NGO / Shelter)</option>
                  <option value="recycler">Recycler / Composting Hub</option>
                  <option value="volunteer">Volunteer Transporter</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Operating District
                </label>
                <select
                  name="district"
                  className="form-input"
                  value={formData.district}
                  onChange={handleChange}
                  style={{ borderRadius: '10px', padding: '11px 14px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}
                >
                  <option value="Colombo">Colombo</option>
                  <option value="Gampaha">Gampaha</option>
                  <option value="Kandy">Kandy</option>
                  <option value="Batticaloa">Batticaloa</option>
                  <option value="Galle">Galle</option>
                  <option value="Jaffna">Jaffna</option>
                  <option value="Kurunegala">Kurunegala</option>
                  <option value="Matara">Matara</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Contact Phone Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                className="form-input"
                placeholder="0771234567"
                value={formData.contactNumber}
                onChange={handleChange}
                required
                style={{ borderRadius: '10px', padding: '11px 14px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="plaid-btn-emerald"
              style={{ width: '100%', padding: '13px', fontSize: '14.5px' }}
              disabled={submitting}
            >
              {submitting ? 'Creating Secure Account...' : 'Create FoodBridge Account'}
              <ArrowRight size={16} />
            </motion.button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#059669', fontWeight: '700', textDecoration: 'none' }}>
              Sign In here
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
