import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, Truck, PackageCheck, Leaf, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import '../styles/home.css';

const steps = [
  { icon: ClipboardList, title: 'Post the details', text: 'Add the food, quantity, storage details, district, and collection deadline.' },
  { icon: Truck, title: 'Collect and deliver', text: 'Volunteers accept available pickups and record the collection and delivery.' },
  { icon: PackageCheck, title: 'Keep a record', text: 'Follow status updates from your dashboard and review completed deliveries.' }
];

export default function HomePage() {
  const { user } = useAuth();
  const dashboard = user ? `/${user.role}` : null;
  const shareTarget = dashboard || '/register?role=donor';
  const volunteerTarget = dashboard || '/register?role=volunteer';
  return (
    <main id="main-content" className="fb-home">
      <section className="fb-home-hero" aria-labelledby="home-title">
        <div className="fb-home-copy">
          <p className="fb-overline"><MapPin size={16} aria-hidden="true" /> Food sharing in Sri Lanka</p>
          <h1 id="home-title">Share food with<br />your community.</h1>
          <p className="fb-home-lead">Share surplus food or help collect it for people who need it.</p>
          <div className="fb-home-actions"><Button to={shareTarget}>Share food <ArrowRight size={18} aria-hidden="true" /></Button><Button to={volunteerTarget} variant="secondary">Volunteer</Button></div>
          <p className="fb-home-caption">{user ? 'Continue to your dashboard for the actions available to your account.' : 'For restaurants, households, and local volunteers.'}</p>
        </div>
        <Card as="aside" className="fb-preparation" aria-labelledby="prepare-title">
          <div className="fb-preparation-heading"><span className="fb-icon-tile"><Leaf size={24} aria-hidden="true" /></span><span>Before you share</span></div>
          <h2 id="prepare-title">A few details make<br />collection easier.</h2>
          <ul className="fb-preparation-list">
            <li><span>01</span><div><h3>What you have</h3><p>Food type, quantity, and a photo of the food.</p></div></li>
            <li><span>02</span><div><h3>How it is stored</h3><p>Storage conditions and when it was prepared.</p></div></li>
            <li><span>03</span><div><h3>When to collect</h3><p>Your district and the collection deadline.</p></div></li>
          </ul>
        </Card>
      </section>

      <section className="fb-how" aria-labelledby="how-title">
        <div className="fb-section-intro"><p className="fb-overline">From posting to delivery</p><h2 id="how-title">How FoodBridge works</h2></div>
        <ol className="fb-steps">{steps.map(({ icon: Icon, title, text }, index) => <li key={title}><span className="fb-step-number">Step {index + 1}</span><Icon size={24} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></li>)}</ol>
      </section>

      <section className="fb-home-more" aria-label="Other ways to take part">
        <Card as="article"><p className="fb-overline">Waste collection</p><h2>Keep food and waste separate.</h2><p>Donors can also post organic waste and recyclable materials as collection requests.</p><Link to={shareTarget}>Post a collection request <ArrowRight size={16} aria-hidden="true" /></Link></Card>
        <Card as="article"><p className="fb-overline">Recipient organisations & recyclers</p><h2>Register your organisation.</h2><p>Create an account for admin review. Food browsing and claims are not available in these dashboards yet.</p><Link to={dashboard || '/register?role=recipient'}>{user ? 'Open your dashboard' : 'Register an organisation'} <ArrowRight size={16} aria-hidden="true" /></Link></Card>
      </section>

      <section className="fb-home-impact" aria-labelledby="home-impact-title"><div><h2 id="home-impact-title">See the recorded results.</h2><p>Completed deliveries, recycling quantities, and districts covered.</p></div><Button to="/impact" variant="ghost">Community impact <ArrowRight size={18} aria-hidden="true" /></Button></section>
    </main>
  );
}
