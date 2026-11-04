import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/home.css';

const roles = [
  {
    name: 'Donor',
    detail: 'Share surplus food or post waste for collection.',
    audience: 'Hotels · Restaurants · Caterers'
  },
  {
    name: 'Recipient',
    detail: 'Register your food-receiving organisation.',
    audience: 'Charities · Shelters · Care Homes'
  },
  {
    name: 'Recycler',
    detail: 'Register your waste-collection organisation.',
    audience: 'Composters · Bio-gas · Processors'
  },
  {
    name: 'Volunteer',
    detail: 'Help with local pickups and deliveries.',
    audience: 'Couriers · Riders · Drivers'
  },
  {
    name: 'Admin',
    detail: 'Manage accounts, verification and activity.',
    audience: 'Verification & Audits'
  },
];

const faqs = [
  {
    q: 'Is there any cost to use FoodBridge?',
    a: 'FoodBridge is completely free for all participants. Donors, recipient organisations, recyclers, and volunteers do not pay any subscription, listing, or claim fees.'
  },
  {
    q: 'Who can post food donations?',
    a: 'Hotels, restaurants, supermarkets, bakeries, corporate cafeterias, event caterers, and commercial kitchens with safe, surplus consumable food or separate organic waste.'
  },
  {
    q: 'Why do recipient organisations require verification?',
    a: 'To protect public health and ensure food reaches genuine vulnerable groups, recipient charities and care homes must submit identification and pass administrator verification before requesting or receiving food batches.'
  },
  {
    q: 'Which districts in Sri Lanka are supported?',
    a: 'All 25 administrative districts are supported in the system. Postings and volunteer courier pickups are coordinated locally within the specified district to minimize transit time.'
  },
  {
    q: 'What transport is needed to volunteer?',
    a: 'Volunteers can transport batches using motorbikes, three-wheelers, cars, or small vans depending on the volume, container requirements, and route distance indicated on the pickup job.'
  }
];

export default function HomePage() {
  const { user } = useAuth();
  return (
    <main id="main-content" className="fb-home">
      <section className="fb-home-welcome" aria-labelledby="home-title">
        <div className="fb-home-message">
          <h1 id="home-title">A little sharing.<br />A lot of<br /><span>possibility.</span></h1>
          <p>Food sharing and waste collection in Sri Lanka. Bring what you have. Find where you can help.</p>
          <div className="fb-home-principle">
            <span><span className="fb-principle-dot" aria-hidden="true" />Food for sharing</span>
            <span><span className="fb-principle-dot fb-principle-dot--waste" aria-hidden="true" />Waste for separate collection</span>
          </div>
          <div className="fb-home-pulse-strip" role="status" aria-label="Platform operational status">
            <span className="fb-pulse-live">
              <span className="fb-pulse-radar" aria-hidden="true" />
              Platform active
            </span>
            <span className="fb-pulse-item">25 districts supported</span>
            <span className="fb-pulse-item">Verified handovers only</span>
            <span className="fb-pulse-item">Zero platform fees</span>
          </div>
          <div className="fb-home-actions">
            <a className="fb-home-explore" href="#how-it-works">See how it works <ArrowDown size={20} aria-hidden="true" /></a>
            {user ? (
              <Link className="fb-home-subaction" to={`/${user.role}`}>
                Open your {user.role} dashboard <ArrowRight size={18} aria-hidden="true" />
              </Link>
            ) : (
              <Link className="fb-home-subaction" to="/login">
                Already active? Sign in <ArrowRight size={18} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
        <div className="fb-home-directory">
          <div className="fb-home-directory-heading"><h2>Find your place.</h2><p>{user ? 'You are signed in. Each role link opens your dashboard.' : 'Five roles. One connected community.'}</p></div>
          <nav className="fb-role-picker" aria-label="Choose your role">
            {roles.map(({ name, detail, audience }) => {
              const role = name.toLowerCase();
              const target = user ? `/${user.role}` : role === 'admin' ? '/login' : `/register?role=${role}`;
              return (
                <Link key={role} to={target} aria-label={user ? `${name}: open your dashboard` : role === 'admin' ? 'Admin sign in' : `Register as ${name}`}>
                  <span className="fb-role-body">
                    <span className="fb-role-header">
                      <strong>{name}</strong>
                      <span className="fb-role-audience">{audience}</span>
                    </span>
                    <span className="fb-role-detail">{detail}</span>
                  </span>
                  <ArrowUpRight size={24} aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
          <p className="fb-home-availability">Recipient and recycler browsing and claims are not available yet. Admin access requires sign-in.</p>
          <div className="fb-home-coverage">
            <div className="fb-coverage-graphic" aria-hidden="true">
              <svg viewBox="0 0 240 360" className="fb-srilanka-map" role="img" aria-label="Sri Lanka District Coordination Network">
                <defs>
                  <linearGradient id="islandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e8f3ea" />
                    <stop offset="100%" stopColor="#dcefe0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 55,12 C 68,16 82,32 90,42 C 105,55 125,75 145,95 C 160,108 172,118 178,135 C 190,160 212,185 216,215 C 218,235 210,265 198,285 C 185,310 165,328 152,335 C 135,345 115,354 100,352 C 85,350 72,342 65,335 C 52,320 45,298 42,280 C 35,255 33,235 32,210 C 30,185 24,160 26,145 C 28,125 36,95 40,75 C 44,55 48,25 55,12 Z"
                  fill="url(#islandGrad)"
                  stroke="#b8d9c0"
                  strokeWidth="1.5"
                />
                <g className="fb-map-routes" stroke="#3c7959" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.75">
                  <line x1="55" y1="22" x2="96" y2="95" />
                  <line x1="96" y1="95" x2="87" y2="131" />
                  <line x1="87" y1="131" x2="165" y2="115" />
                  <line x1="165" y1="115" x2="204" y2="186" />
                  <line x1="87" y1="131" x2="83" y2="209" />
                  <line x1="83" y1="209" x2="112" y2="226" />
                  <line x1="112" y1="226" x2="204" y2="186" />
                  <line x1="83" y1="209" x2="42" y2="258" />
                  <line x1="112" y1="226" x2="149" y2="253" />
                  <line x1="42" y1="258" x2="69" y2="335" />
                  <line x1="69" y1="335" x2="102" y2="346" />
                  <line x1="102" y1="346" x2="156" y2="330" />
                  <line x1="149" y1="253" x2="156" y2="330" />
                </g>
                <g className="fb-map-nodes">
                  <circle cx="55" cy="22" r="3.5" fill="#167347" />
                  <circle cx="87" cy="131" r="3" fill="#167347" />
                  <circle cx="165" cy="115" r="3" fill="#167347" />
                  <circle cx="112" cy="226" r="4" fill="#167347" />
                  <circle cx="204" cy="186" r="3" fill="#167347" />
                  <circle cx="42" cy="258" r="6" fill="#167347" opacity="0.3" className="fb-colombo-pulse" />
                  <circle cx="42" cy="258" r="4" fill="#b54726" />
                  <circle cx="69" cy="335" r="3.5" fill="#167347" />
                  <circle cx="149" cy="253" r="3" fill="#167347" />
                </g>
              </svg>
            </div>
            <div className="fb-coverage-details">
              <div className="fb-coverage-header">
                <span className="fb-coverage-live-badge">Dispatch Map</span>
                <strong>25 Administrative Districts</strong>
              </div>
              <p>Surplus food &amp; recyclable waste are coordinated locally across Sri Lanka to minimize travel time and prevent spoilage.</p>
              <div className="fb-coverage-districts-list">
                <span>Colombo</span>
                <span>Gampaha</span>
                <span>Kandy</span>
                <span>Galle</span>
                <span>Jaffna</span>
                <span>+20 more</span>
              </div>
            </div>
          </div>
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

      <section className="fb-home-streams" aria-labelledby="streams-title">
        <div className="fb-home-section-heading">
          <h2 id="streams-title">Two distinct streams.<br />No confusion.</h2>
          <p>Edible surplus nourishes communities. Organic scraps and packaging fuel recycling. The two never cross.</p>
        </div>
        <div className="fb-home-streams-grid">
          <article className="fb-stream-column">
            <span className="fb-stream-tag">Stream 01 &middot; Edible Surplus</span>
            <h3>Food for sharing</h3>
            <p className="fb-stream-desc">Cooked meals from commercial kitchens, excess agricultural harvest, bakery items, and shelf-stable groceries.</p>
            <ul className="fb-stream-specs">
              <li><strong>Destination:</strong> Verified care homes, children’s shelters, and community kitchens.</li>
              <li><strong>Condition:</strong> Strict storage criteria (hot-holding, chilled, or ambient) with verified preparation time.</li>
              <li><strong>Matching:</strong> Local district dispatch to ensure fast, safe handover within the collection window.</li>
            </ul>
          </article>
          <article className="fb-stream-column fb-stream-column--waste">
            <span className="fb-stream-tag fb-stream-tag--waste">Stream 02 &middot; Separate Recovery</span>
            <h3>Waste for collection</h3>
            <p className="fb-stream-desc">Inedible food scraps, spoiled produce, agricultural byproducts, and clean packaging like cardboard, glass, and plastic.</p>
            <ul className="fb-stream-specs">
              <li><strong>Destination:</strong> Registered industrial composters, animal feed processors, and material recyclers.</li>
              <li><strong>Condition:</strong> Separated at source into clean categories with volume and contamination estimates.</li>
              <li><strong>Outcome:</strong> Verified processing logs with digital diversion certificates for commercial donors.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="fb-home-standards" aria-labelledby="standards-title">
        <div className="fb-home-section-heading">
          <h2 id="standards-title">Built on verification,<br />not assumptions.</h2>
          <p>Handling food and waste requires accountability at every handover, from kitchen to receiver.</p>
        </div>
        <ol className="fb-home-standards-grid">
          <li>
            <span className="fb-home-step">Standard 01</span>
            <h3>Temperature &amp; timing</h3>
            <p>Every edible listing requires a preparation timestamp, storage category (hot, chilled, or ambient), and mandatory pickup expiration.</p>
          </li>
          <li>
            <span className="fb-home-step">Standard 02</span>
            <h3>Admin vetting</h3>
            <p>Charities, shelters, and recyclers undergo manual verification before accessing postings, preventing misuse and safeguarding food security.</p>
          </li>
          <li>
            <span className="fb-home-step">Standard 03</span>
            <h3>Two-party handover</h3>
            <p>Deliveries are only recorded as complete when the receiving organisation confirms receipt and quality in their dashboard.</p>
          </li>
        </ol>
      </section>

      <section className="fb-home-faq" aria-labelledby="faq-title">
        <div className="fb-home-section-heading">
          <h2 id="faq-title">Frequently asked<br />questions.</h2>
          <p>Everything you need to know about participating in the network across Sri Lanka.</p>
        </div>
        <div className="fb-home-faq-list">
          {faqs.map(({ q, a }) => (
            <details key={q} className="fb-faq-item">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="fb-home-outcomes" aria-labelledby="outcomes-title">
        <div><h2 id="outcomes-title">Every record tells<br />part of the story.</h2><p>Explore completed food deliveries and waste collection, reported separately.</p></div>
        <Link to="/impact">Explore community impact <ArrowRight size={24} aria-hidden="true" /></Link>
      </section>
    </main>
  );
}
