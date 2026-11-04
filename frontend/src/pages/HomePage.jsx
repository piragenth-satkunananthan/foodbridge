import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/home.css';

const roles = [
  { name: 'Donor', detail: 'Share surplus food or post waste for collection.' },
  { name: 'Recipient', detail: 'Register your food-receiving organisation.' },
  { name: 'Recycler', detail: 'Register your waste-collection organisation.' },
  { name: 'Volunteer', detail: 'Help with local pickups and deliveries.' },
  { name: 'Admin', detail: 'Manage accounts, verification and activity.' },
];

export default function HomePage() {
  const { user } = useAuth();
  return (
    <main id="main-content" className="fb-home">
      <section className="fb-home-welcome" aria-labelledby="home-title">
        <div className="fb-home-message">
          <h1 id="home-title">A little sharing.<br />A lot of<br /><span>possibility.</span></h1>
          <p>Food sharing and waste collection in Sri Lanka. Bring what you have. Find where you can help.</p>
          <a className="fb-home-explore" href="#how-it-works">See how it works <ArrowDown size={20} aria-hidden="true" /></a>
          <div className="fb-home-principle"><span>Food for sharing.</span><span>Waste for separate collection.</span></div>
        </div>
        <div className="fb-home-directory">
          <div className="fb-home-directory-heading"><h2>Find your place.</h2><p>{user ? 'You are signed in. Each role link opens your dashboard.' : 'Five roles. One connected community.'}</p></div>
          <nav className="fb-role-picker" aria-label="Choose your role">
            {roles.map(({ name, detail }) => {
              const role = name.toLowerCase();
              const target = user ? `/${user.role}` : role === 'admin' ? '/login' : `/register?role=${role}`;
              return <Link key={role} to={target} aria-label={user ? `${name}: open your dashboard` : role === 'admin' ? 'Admin sign in' : `Register as ${name}`}><span><strong>{name}</strong><span className="fb-role-detail">{detail}</span></span><ArrowUpRight size={24} aria-hidden="true" /></Link>;
            })}
          </nav>
          <p className="fb-home-availability">Recipient and recycler browsing and claims are not available yet. Admin access requires sign-in.</p>
        </div>
      </section>
      <section id="how-it-works" className="fb-home-workflow" aria-labelledby="workflow-title">
        <div className="fb-home-section-heading"><h2 id="workflow-title">Good intentions.<br />Clear next steps.</h2><p>Keep the practical details in one place, from the first listing to the recorded delivery.</p></div>
        <ol>
          <li><span className="fb-home-step">01</span><h3>Tell us what you have.</h3><p>Donors add the type, quantity, district, storage details and collection deadline.</p></li>
          <li><span className="fb-home-step">02</span><h3>Help it get there.</h3><p>Volunteers accept available pickups and record collection and delivery.</p></li>
          <li><span className="fb-home-step">03</span><h3>Keep track together.</h3><p>Follow status updates in your dashboard and review completed deliveries.</p></li>
        </ol>
      </section>
      <section className="fb-home-outcomes" aria-labelledby="outcomes-title">
        <div><h2 id="outcomes-title">Every record tells<br />part of the story.</h2><p>Explore completed food deliveries and waste collection, reported separately.</p></div>
        <Link to="/impact">Explore community impact <ArrowRight size={24} aria-hidden="true" /></Link>
      </section>
    </main>
  );
}
