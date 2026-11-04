import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/home.css';

const roles = [
  { name: 'Donor', description: 'List surplus food or waste for collection.' },
  { name: 'Recipient', description: 'Join as an organisation receiving food.' },
  { name: 'Recycler', description: 'Join as an organisation collecting waste.' },
  { name: 'Volunteer', description: 'Help with pickups and deliveries in your district.' },
  { name: 'Admin', description: 'Manage users, verification and activity.' },
];

export default function HomePage() {
  const { user } = useAuth();
  return (
    <main id="main-content" className="fb-home">
      <section className="fb-home-hero" aria-labelledby="home-title">
        <div className="fb-home-copy">
          <h1 id="home-title">Good food.<br />A new <span>beginning.</span></h1>
          <div className="fb-home-intro"><p>Make room for sharing. Connect surplus food, waste collection and willing hands across Sri Lanka.</p>
          <a className="fb-home-action" href="#role-title">Find your place <ArrowDown size={20} aria-hidden="true" /></a></div>
        </div>
        <figure className="fb-home-photo">
          <img src="/images/homepage-handover-wide.png" width="1536" height="1024" alt="Illustration of two people sharing a crate of fresh vegetables" fetchPriority="high" />
          <figcaption>Food sharing starts with a handover.<span>AI-generated illustration</span></figcaption>
        </figure>
      </section>
      <section className="fb-home-entry" aria-labelledby="role-title">
        <div className="fb-role-intro">
          <h2 id="role-title">Different roles.<br />Shared purpose.</h2>
          <p>Choose where you fit. Every role has a place in FoodBridge.</p>
          <p className="fb-home-notes">Recipient and recycler browsing and claims are not available yet. Admin access requires sign-in.</p>
        </div>
        <nav className="fb-role-picker" aria-label="Choose your role">
          {roles.map(({ name, description }) => {
            const role = name.toLowerCase();
            const target = user ? `/${user.role}` : role === 'admin' ? '/login' : `/register?role=${role}`;
            return <Link key={role} to={target} aria-label={user ? `${name}: open your dashboard` : role === 'admin' ? 'Admin sign in' : `Register as ${name}`}><span className="fb-role-name">{name}</span><span className="fb-role-description">{description}</span><ArrowRight size={24} aria-hidden="true" /></Link>;
          })}
        </nav>
      </section>
      <section id="how-it-works" className="fb-how" aria-labelledby="how-title">
        <div className="fb-how-heading"><h2 id="how-title">A little coordination.<br />A clear next step.</h2><p>From listing to delivery, keep the details together.</p></div>
        <ol>
          <li><h3>Post the details</h3><p>Add the food or waste type, quantity, district, storage details and collection deadline.</p></li>
          <li><h3>Collect and deliver</h3><p>Volunteers accept available pickups and record collection and delivery.</p></li>
          <li><h3>Keep a record</h3><p>Follow status updates from your dashboard and review completed deliveries.</p></li>
        </ol>
      </section>
      <section className="fb-home-impact" aria-labelledby="impact-title">
        <h2 id="impact-title">See the work.<br /><span>Follow the impact.</span></h2>
        <div><p>Food shared and waste collected, recorded separately.</p><Link to="/impact">View community impact <ArrowRight size={22} aria-hidden="true" /></Link></div>
      </section>
    </main>
  );
}
