import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  return <main className="auth-layout">
    <div className="auth-intro"><h1>Create your account</h1><p>Already registered? <Link to="/login">Sign in</Link></p></div>
    <section className="auth-form" aria-label="Create an account">
      {error && <p className="report-error" role="alert">{error}</p>}
      <form onSubmit={submit}>
        <label htmlFor="register-name">Your name or organisation name</label><input id="register-name" name="name" autoComplete="name" required value={form.name} onChange={change} />
        <label htmlFor="register-email">Email address</label><input id="register-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={change} />
        <label htmlFor="register-password">Password</label><input id="register-password" name="password" type="password" autoComplete="new-password" required value={form.password} onChange={change} />
        <div className="form-columns"><div><label htmlFor="register-role">I’m joining as a</label><select id="register-role" name="role" value={form.role} onChange={change}><option value="donor">Donor</option><option value="recipient">Recipient organisation</option><option value="recycler">Recycler</option><option value="volunteer">Volunteer</option></select></div><div><label htmlFor="register-district">District</label><select id="register-district" name="district" value={form.district} onChange={change}>{districts.map(d => <option key={d}>{d}</option>)}</select></div></div>
        <label htmlFor="register-phone">Contact number</label><input id="register-phone" name="contactNumber" type="tel" autoComplete="tel" required value={form.contactNumber} onChange={change} />
        {['recipient', 'recycler'].includes(form.role) && <p className="report-note">Organisation accounts require admin verification. Requests and claims are not yet available in these dashboards.</p>}
        <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
      </form>
    </section>
  </main>;
}
