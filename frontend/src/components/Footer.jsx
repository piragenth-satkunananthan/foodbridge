import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/navigation.css';

export default function Footer() {
  const { pathname } = useLocation();
  return <footer className={`fb-footer ${pathname === '/' ? 'fb-footer--home' : ''}`}><div className="fb-footer-inner">
    <div><Link to="/" className="fb-brand">FoodBridge<span aria-hidden="true">.</span></Link><p>Food sharing and waste collection in Sri Lanka.</p></div>
    <Link to="/impact">Community impact</Link>
  </div></footer>;
}
