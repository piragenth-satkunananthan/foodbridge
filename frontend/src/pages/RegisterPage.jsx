import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, ArrowRight } from 'lucide-react';

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
    <div className="main-content" style={{ maxWidth: '540px', margin: '30px auto' }}>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            Join FoodBridge Network
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Register as a food donor, recipient NGO, recycling facility, or volunteer
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
            <label className="form-label">Full Name or Organization Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Grand Cinnamon Hotel or Hope Charity"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="contact@org.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Your Role</label>
              <select
                name="role"
                className="form-input"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="donor">Food Donor</option>
                <option value="recipient">Food Recipient (NGO / Shelter)</option>
                <option value="recycler">Recycler / Composting Facility</option>
                <option value="volunteer">Volunteer Transporter</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Operating District</label>
              <select
                name="district"
                className="form-input"
                value={formData.district}
                onChange={handleChange}
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

          <div className="form-group">
            <label className="form-label">Contact Phone Number</label>
            <input
              type="tel"
              name="contactNumber"
              className="form-input"
              placeholder="0771234567"
              value={formData.contactNumber}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            disabled={submitting}
          >
            {submitting ? 'Creating Account...' : 'Create FoodBridge Account'} <ArrowRight size={15} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: '#059669', fontWeight: '600', textDecoration: 'none' }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
