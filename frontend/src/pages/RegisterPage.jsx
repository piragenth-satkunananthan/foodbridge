import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';

const districts = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'];

export default function RegisterPage() {
  const [params] = useSearchParams();
  const requestedRole = params.get('role');
  const initialRole = ['donor', 'recipient', 'recycler', 'volunteer'].includes(requestedRole) ? requestedRole : 'donor';
  const [form, setForm] = useState({name: '', email: '', password: '', role: initialRole, district: 'Colombo', contactNumber: ''});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const change = e => setForm({...form, [e.target.name]: e.target.value});
  const submit = async e => {
    e.preventDefault(); setSubmitting(true); setError('');
    try { const user = await register(form); navigate(`/${user.role}`); }
    catch (err) { setError(err.message || 'Your account could not be created. Please try again.'); }
    finally { setSubmitting(false); }
  };
  return (
    <main className="auth-page">
      <div className="fb-card auth-card">
        <div className="auth-intro">
          <h1>Create your account</h1>
          <p>Already registered? <Link to="/login">Sign in</Link></p>
        </div>
        <section aria-label="Create an account">
          <form onSubmit={submit}>
            <Field
              id="register-name"
              label="Your name or organisation name"
              name="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={change}
            />
            <Field
              id="register-email"
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={change}
            />
            <Field
              id="register-password"
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              hint="At least 6 characters."
              value={form.password}
              onChange={change}
            />
            <div className="auth-form-columns">
              <Field
                id="register-role"
                label="I'm joining as a"
                as="select"
                name="role"
                value={form.role}
                onChange={change}
              >
                <option value="donor">Donor</option>
                <option value="recipient">Recipient organisation</option>
                <option value="recycler">Recycler</option>
                <option value="volunteer">Volunteer</option>
              </Field>
              <Field
                id="register-district"
                label="District"
                as="select"
                name="district"
                value={form.district}
                onChange={change}
              >
                {districts.map(d => <option key={d}>{d}</option>)}
              </Field>
            </div>
            <Field
              id="register-phone"
              label="Contact number"
              name="contactNumber"
              type="tel"
              autoComplete="tel"
              required
              value={form.contactNumber}
              onChange={change}
            />
            {['recipient', 'recycler'].includes(form.role) && (
              <p className="auth-role-note">Organisation accounts require admin verification. Requests and claims are not yet available in these dashboards.</p>
            )}
            <Button type="submit" variant="primary" className="auth-submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
            {error && <p className="fb-field-error auth-form-error" role="alert">{error}</p>}
          </form>
        </section>
      </div>
    </main>
  );
}
