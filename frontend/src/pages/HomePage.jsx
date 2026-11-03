import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/home.css';

const roles = ['Donor', 'Recipient', 'Recycler', 'Volunteer', 'Admin'];

export default function HomePage() {
  const { user } = useAuth();
  return (
    <main id="main-content" className="fb-home">
      <section className="fb-home-hero" aria-labelledby="home-title">
        <img className="fb-handover" src="/images/homepage-handover-wide.png" width="1536" height="1024" alt="Illustration of two people sharing a crate of fresh vegetables" fetchPriority="high" />
        <div className="fb-home-copy">
          <h1 id="home-title">More shared.<br />Less wasted.</h1>
          <p>Food sharing and waste collection in Sri Lanka.</p>
        </div>
      </section>
      <div className="fb-home-entry">
        <nav className="fb-role-picker" aria-labelledby="role-title">
          <h2 id="role-title">Choose your role</h2>
          {roles.map(label => {
            const role = label.toLowerCase();
            const target = user ? `/${user.role}` : role === 'admin' ? '/login' : `/register?role=${role}`;
            return <Link key={role} to={target} aria-label={user ? `${label}: open your dashboard` : role === 'admin' ? 'Admin sign in' : `Register as ${label}`}>{label}<ArrowRight size={18} aria-hidden="true" /></Link>;
          })}
        </nav>
        <div className="fb-home-notes"><p>Admin access requires sign-in.</p><p>Recipient and recycler browsing and claims are not available yet.</p></div>
      </div>
      <section className="fb-home-impact" aria-label="Community impact">
        <h2>Food shared. Waste collected separately.</h2>
        <Link to="/impact">View community impact <ArrowRight size={22} aria-hidden="true" /></Link>
      </section>
      <section id="how-it-works" className="fb-how" aria-labelledby="how-title">
        <h2 id="how-title">From surplus to a recorded outcome.</h2>
        <ol>
          <li><h3>Post the details</h3><p>Add the food or waste type, quantity, district, storage details, and collection deadline.</p></li>
          <li><h3>Collect and deliver</h3><p>Volunteers accept available pickups and record collection and delivery.</p></li>
          <li><h3>Keep a record</h3><p>Follow status updates from your dashboard and review completed deliveries.</p></li>
        </ol>
        <p className="fb-photo-note">Hero image is AI-generated to illustrate food sharing.</p>
      </section>
    </main>
  );
}
