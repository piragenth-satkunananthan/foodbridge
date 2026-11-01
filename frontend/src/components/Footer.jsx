import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return <footer className="site-footer"><div className="main-content">
    <p>FoodBridge · Food sharing and waste collection in Sri Lanka</p>
    <Link to="/impact">Community impact</Link>
  </div></footer>;
}
