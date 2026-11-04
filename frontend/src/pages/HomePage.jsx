import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, ArrowRight, ClipboardList, Truck, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/home.css';

const roles = [
  { num: '01', name: 'Donor',     detail: 'Share surplus food or post waste for collection.',  color: 'donor' },
  { num: '02', name: 'Recipient', detail: 'Register your food-receiving organisation.',          color: 'recipient' },
  { num: '03', name: 'Recycler',  detail: 'Register your waste-collection organisation.',        color: 'recycler' },
  { num: '04', name: 'Volunteer', detail: 'Help with local pickups and deliveries.',             color: 'volunteer' },
  { num: '05', name: 'Admin',     detail: 'Manage accounts, verification and activity.',         color: 'admin' },
];

const steps = [
  { num: '01', Icon: ClipboardList, title: 'Tell us what you have.',  body: 'Donors add the type, quantity, district, storage details and collection deadline.' },
  { num: '02', Icon: Truck,         title: 'Help it get there.',       body: 'Volunteers accept available pickups and record collection and delivery.' },
  { num: '03', Icon: CheckSquare,   title: 'Keep track together.',     body: 'Follow status updates in your dashboard and review completed deliveries.' },
];

export default function HomePage() {
  const { user } = useAuth();
  return (
    <main id="main-content" className="fb-home">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="fb-home-welcome" aria-labelledby="home-title">
        <div className="fb-home-message">
          <p className="fb-home-eyebrow">Food sharing · Sri Lanka</p>
          <h1 id="home-title">A little sharing.<br />A lot of<br /><span>possibility.</span></h1>
          <p className="fb-home-lead">Bring what you have. Find where you can help. Every step recorded.</p>
          <a className="fb-home-explore" href="#how-it-works">
            See how it works <ArrowDown size={20} aria-hidden="true" />
          </a>
          <div className="fb-home-principle">
            <span>Food for sharing.</span>
            <span>Waste for separate collection.</span>
          </div>
        </div>

        {/* ── Role directory ───────────────────────────────── */}
        <div className="fb-home-directory">
          <div className="fb-home-directory-heading">
            <h2>Find your place.</h2>
            <p>{user ? 'You are signed in. Each link opens your dashboard.' : 'Five roles. One connected community.'}</p>
          </div>
          <nav className="fb-role-picker" aria-label="Choose your role">
            {roles.map(({ num, name, detail, color }) => {
              const role = name.toLowerCase();
              const target = user
                ? `/${user.role}`
                : role === 'admin' ? '/login' : `/register?role=${role}`;
              const label = user
                ? `${name}: open your dashboard`
                : role === 'admin' ? 'Admin sign in' : `Register as ${name}`;
              return (
                <Link key={role} to={target} aria-label={label} data-role={color}>
                  <span className="fb-role-num">{num}</span>
                  <span className="fb-role-body">
                    <strong>{name}</strong>
                    <span className="fb-role-detail">{detail}</span>
                  </span>
                  <ArrowUpRight size={22} aria-hidden="true" className="fb-role-arrow" />
                </Link>
              );
            })}
          </nav>
          <p className="fb-home-availability">
            Recipient and recycler browsing and claims are not available yet. Admin access requires sign-in.
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section id="how-it-works" className="fb-home-workflow" aria-labelledby="workflow-title">
        <div className="fb-home-section-heading">
          <h2 id="workflow-title">Good intentions.<br />Clear next steps.</h2>
          <p>Keep the practical details in one place, from the first listing to the recorded delivery.</p>
        </div>
        <ol>
          {steps.map(({ num, Icon, title, body }) => (
            <li key={num}>
              <div className="fb-step-icon" aria-hidden="true"><Icon size={22} /></div>
              <span className="fb-home-step">{num}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Impact CTA ───────────────────────────────────── */}
      <section className="fb-home-outcomes" aria-labelledby="outcomes-title">
        <div>
          <h2 id="outcomes-title">Every record tells<br />part of the story.</h2>
          <p>Explore completed food deliveries and waste collection, reported separately.</p>
        </div>
        <Link to="/impact" className="fb-outcomes-cta">
          Explore community impact <ArrowRight size={22} aria-hidden="true" />
        </Link>
      </section>

    </main>
  );
}
