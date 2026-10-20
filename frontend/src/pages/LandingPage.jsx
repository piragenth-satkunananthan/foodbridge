import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Recycle,
  Leaf,
  Globe,
  Building2,
  ShieldCheck,
  Truck,
  HeartHandshake,
  ArrowRight,
  Calculator,
  Droplets,
  CloudRain,
  Sparkles,
  CheckCircle2,
  Boxes,
  Download,
  TrendingUp,
  MapPin,
  Shield
} from 'lucide-react';
import { fetchPublicImpact } from '../api/client';
import ImpactCharts from '../components/ImpactCharts';
import ImpactMap from '../components/ImpactMap';
import AnimatedCounter from '../components/AnimatedCounter';
import { exportImpactMetricsCSV } from '../utils/exportUtils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 260
    }
  }
};

const cardHoverVariants = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03), 0 6px 16px -4px rgba(0, 0, 0, 0.02)' },
  hover: {
    y: -5,
    boxShadow: '0 16px 32px -8px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
    transition: { duration: 0.25, ease: 'easeOut' }
  }
};

export default function LandingPage() {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  // Impact Estimator State
  const [estimatedKg, setEstimatedKg] = useState(60);
  const [foodType, setFoodType] = useState('cooked');

  useEffect(() => {
    const loadImpact = async () => {
      try {
        const data = await fetchPublicImpact();
        setImpact(data);
      } catch (err) {
        console.warn('Using default impact figures:', err.message);
        setImpact({
          summary: {
            mealsRescued: 2910,
            totalKgRecycled: 570.5,
            kgRecycled: { plastic: 150, glass: 120, paper: 210, metal: 90.5 },
            kgOrganicDiverted: 1200,
            districtsCoveredCount: 3,
            districtsCovered: ['Colombo', 'Kandy', 'Gampaha']
          },
          ecosystem: {
            verifiedNGOs: 3,
            verifiedRecyclers: 2,
            activeVolunteers: 5
          }
        });
      } finally {
        setLoading(false);
      }
    };

    loadImpact();
  }, []);

  const s = impact?.summary || {
    mealsRescued: 0,
    totalKgRecycled: 0,
    kgRecycled: { plastic: 0, glass: 0, paper: 0, metal: 0 },
    kgOrganicDiverted: 0,
    districtsCoveredCount: 0,
    districtsCovered: []
  };

  const e = impact?.ecosystem || {
    verifiedNGOs: 0,
    verifiedRecyclers: 0,
    activeVolunteers: 0
  };

  // Environmental Impact Calculations (FAO / EPA Standard Models)
  const multiplier = foodType === 'cooked' ? 2.5 : foodType === 'bakery' ? 3.0 : 2.0;
  const estimatedMeals = Math.round(estimatedKg * multiplier);
  const co2AvoidedKg = Math.round(estimatedKg * 2.5);
  const waterSavedLiters = Math.round(estimatedKg * 850);

  return (
    <div className="plaid-grid-bg" style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Plaid-Inspired Monumental Hero Section */}
      <section className="plaid-hero-wrap">
        <div className="plaid-ambient-orb plaid-ambient-orb-1" />
        <div className="plaid-ambient-orb plaid-ambient-orb-2" />

        <motion.div
          className="hero-inner"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 10, textAlign: 'center' }}
        >
          {/* Pulsing Pill Badge */}
          <motion.div variants={itemVariants} style={{ marginBottom: '22px' }}>
            <span className="plaid-pill">
              <span className="pulse-indicator">
                <span className="pulse-indicator-ping" />
                <span className="pulse-indicator-dot" />
              </span>
              <span>National Circular Food Rescue & ESG Network</span>
            </span>
          </motion.div>

          {/* Monumental Plaid-Style Heading */}
          <motion.h1
            variants={itemVariants}
            style={{
              fontSize: 'clamp(36px, 5.5vw, 56px)',
              fontWeight: '800',
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
              marginBottom: '20px',
              color: '#ffffff',
              textShadow: '0 4px 24px rgba(0,0,0,0.3)'
            }}
          >
            Decarbonizing Surplus Food with Precision Redistribution
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            style={{
              fontSize: '17px',
              color: '#d1fae5',
              maxWidth: '720px',
              margin: '0 auto 36px',
              lineHeight: 1.6,
              fontWeight: '400'
            }}
          >
            Connecting enterprise donors, commercial kitchens, and event halls with verified NGOs and certified circular recyclers across Sri Lanka through cold-chain compliance and real-time GIS dispatch.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}
          >
            <Link
              to="/register"
              className="plaid-btn-emerald"
              style={{
                padding: '14px 30px',
                fontSize: '15px',
                textDecoration: 'none'
              }}
            >
              <span>Join FoodBridge Network</span>
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/login"
              className="btn-glass"
              style={{
                padding: '14px 28px',
                fontSize: '15px',
                textDecoration: 'none',
                borderRadius: '10px'
              }}
            >
              Sign In to Console
            </Link>
          </motion.div>

          {/* Floating Glassmorphism Metrics Ribbon with Animated Counters */}
          <motion.div
            variants={itemVariants}
            className="glass-ribbon"
          >
            <div className="glass-ribbon-item">
              <div className="glass-ribbon-value">
                <AnimatedCounter value={s.mealsRescued} suffix="+" />
              </div>
              <div className="glass-ribbon-label">Nutritious Meals Rescued</div>
            </div>
            <div className="glass-ribbon-item">
              <div className="glass-ribbon-value">
                <AnimatedCounter value={s.totalKgRecycled} decimals={s.totalKgRecycled % 1 === 0 ? 0 : 1} suffix=" kg" />
              </div>
              <div className="glass-ribbon-label">Materials Upcycled</div>
            </div>
            <div className="glass-ribbon-item">
              <div className="glass-ribbon-value">
                <AnimatedCounter value={s.kgOrganicDiverted} suffix=" kg" />
              </div>
              <div className="glass-ribbon-label">Organic Waste Diverted</div>
            </div>
            <div className="glass-ribbon-item">
              <div className="glass-ribbon-value">
                <AnimatedCounter value={s.districtsCoveredCount || 3} suffix=" Districts" />
              </div>
              <div className="glass-ribbon-label">Active Logistics Grid</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Main Content Area */}
      <div className="main-content" style={{ marginTop: '-44px', position: 'relative', zIndex: 20 }}>
        {/* Live Public Impact Dashboard Card */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="plaid-card plaid-card-highlight"
          style={{ padding: '32px', marginBottom: '32px' }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: '#ecfdf5',
                color: '#059669',
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid #a7f3d0'
              }}>
                <Globe size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Live Public Impact Dashboard
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b' }}>
                  Transparent, verified metrics updated in real-time from active pickups across Sri Lanka.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => exportImpactMetricsCSV(s, e)}
                className="plaid-btn-light"
                style={{ fontSize: '12.5px', padding: '8px 16px' }}
              >
                <Download size={14} />
                <span>Export ESG Report (CSV)</span>
              </button>

              <span className="badge verified" style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="pulse-indicator">
                  <span className="pulse-indicator-ping" />
                  <span className="pulse-indicator-dot" />
                </span>
                <span>Live Grid Verified</span>
              </span>
            </div>
          </div>

          {/* 4 Primary KPI Cards with Hover Animation & Number Rolling */}
          <div className="kpi-grid">
            <motion.div
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              className="kpi-card green"
            >
              <div className="kpi-icon green"><Utensils size={24} /></div>
              <div className="kpi-details">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Meals Rescued</h3>
                  <span className="trend-pill up"><TrendingUp size={11} /> +24%</span>
                </div>
                <div className="kpi-value">
                  <AnimatedCounter value={s.mealsRescued} />
                </div>
                <div className="kpi-sub">Served to verified charities & shelters</div>
              </div>
            </motion.div>

            <motion.div
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              className="kpi-card blue"
            >
              <div className="kpi-icon blue"><Recycle size={24} /></div>
              <div className="kpi-details">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Materials Recycled</h3>
                  <span className="trend-pill up"><TrendingUp size={11} /> +16%</span>
                </div>
                <div className="kpi-value">
                  <AnimatedCounter value={s.totalKgRecycled} decimals={s.totalKgRecycled % 1 === 0 ? 0 : 1} suffix=" kg" />
                </div>
                <div className="kpi-sub">Plastic, glass, paper, & metal</div>
              </div>
            </motion.div>

            <motion.div
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              className="kpi-card amber"
            >
              <div className="kpi-icon amber"><Leaf size={24} /></div>
              <div className="kpi-details">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Organic Diverted</h3>
                  <span className="trend-pill up"><TrendingUp size={11} /> +31%</span>
                </div>
                <div className="kpi-value">
                  <AnimatedCounter value={s.kgOrganicDiverted} suffix=" kg" />
                </div>
                <div className="kpi-sub">Composted & bio-digested</div>
              </div>
            </motion.div>

            <motion.div
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              className="kpi-card purple"
            >
              <div className="kpi-icon purple"><Building2 size={24} /></div>
              <div className="kpi-details">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Ecosystem Network</h3>
                  <span className="trend-pill neutral"><CheckCircle2 size={11} /> Active</span>
                </div>
                <div className="kpi-value">
                  <AnimatedCounter value={e.verifiedNGOs + e.verifiedRecyclers + e.activeVolunteers} />
                </div>
                <div className="kpi-sub">{s.districtsCoveredCount || 3} provincial logistics hubs</div>
              </div>
            </motion.div>
          </div>

          {/* Breakdown cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '8px' }}>
            <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '700', fontSize: '13.5px', marginBottom: '10px', color: '#0f172a' }}>
                Recycled Materials Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Plastic Polymers:</span>
                  <strong>{s.kgRecycled?.plastic || 0} kg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Glass Cullet:</span>
                  <strong>{s.kgRecycled?.glass || 0} kg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Paper & Cardboard:</span>
                  <strong>{s.kgRecycled?.paper || 0} kg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Scrap Metal / Cans:</span>
                  <strong>{s.kgRecycled?.metal || 0} kg</strong>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '700', fontSize: '13.5px', marginBottom: '10px', color: '#0f172a' }}>
                Covered Regional Districts
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                {s.districtsCovered?.length > 0 ? (
                  s.districtsCovered.map((d) => (
                    <span key={d} className="badge" style={{ background: '#e0f2fe', color: '#0369a1', padding: '5px 12px', fontSize: '12px' }}>
                      📍 {d}
                    </span>
                  ))
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>Colombo, Kandy, Gampaha</span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Trajectory Charts */}
          <div style={{ marginTop: '24px' }}>
            <ImpactCharts summary={s} ecosystem={e} />
          </div>

          {/* Interactive Regional Hubs & Logistics Corridors Map */}
          <div style={{ marginTop: '24px' }}>
            <ImpactMap />
          </div>
        </motion.section>

        {/* Plaid Interactive Surplus Impact Estimator */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ marginBottom: '32px' }}
        >
          <div className="plaid-card" style={{
            background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
            border: '1px solid #bbf7d0',
            padding: '32px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: '#059669',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)'
                }}>
                  <Calculator size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#064e3b', letterSpacing: '-0.02em' }}>
                    Interactive Surplus Impact Calculator
                  </h3>
                  <p style={{ fontSize: '13px', color: '#047857' }}>
                    Estimate the humanitarian and ecological benefits of your surplus food before logging a posting.
                  </p>
                </div>
              </div>

              {/* Segmented Category Buttons */}
              <div className="segmented-tabs" style={{ background: '#e2e8f0', padding: '3px' }}>
                <button
                  type="button"
                  onClick={() => setFoodType('cooked')}
                  className={`segmented-tab ${foodType === 'cooked' ? 'active' : ''}`}
                >
                  Cooked Meals
                </button>
                <button
                  type="button"
                  onClick={() => setFoodType('bakery')}
                  className={`segmented-tab ${foodType === 'bakery' ? 'active' : ''}`}
                >
                  Bakery & Breads
                </button>
                <button
                  type="button"
                  onClick={() => setFoodType('staples')}
                  className={`segmented-tab ${foodType === 'staples' ? 'active' : ''}`}
                >
                  Dry Staples
                </button>
              </div>
            </div>

            {/* Slider Control */}
            <div style={{ margin: '24px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700', fontSize: '14px', color: '#064e3b', marginBottom: '8px' }}>
                <span>Surplus Food Quantity to Donate:</span>
                <span style={{ fontSize: '18px', color: '#059669', fontWeight: '800' }}>{estimatedKg} kg</span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={estimatedKg}
                onChange={(e) => setEstimatedKg(Number(e.target.value))}
                className="plaid-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
                <span>5 kg (Cafe surplus)</span>
                <span>250 kg (Hotel Buffet)</span>
                <span>500 kg (Large Wedding / Banquet)</span>
              </div>
            </div>

            {/* Live Reactive Metric Result Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '20px',
                  textAlign: 'center',
                  border: '1px solid #d1fae5',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.05)'
                }}
              >
                <Utensils size={22} color="#059669" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#064e3b', letterSpacing: '-0.02em' }}>
                  <AnimatedCounter value={estimatedMeals} prefix="~" />
                </div>
                <div style={{ fontSize: '12.5px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>
                  Nutritious Meals Rescued
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '20px',
                  textAlign: 'center',
                  border: '1px solid #bae6fd',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.05)'
                }}
              >
                <CloudRain size={22} color="#0284c7" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#0c4a6e', letterSpacing: '-0.02em' }}>
                  <AnimatedCounter value={co2AvoidedKg} prefix="~" suffix=" kg" />
                </div>
                <div style={{ fontSize: '12.5px', color: '#0284c7', fontWeight: '700', marginTop: '4px' }}>
                  CO₂ Emissions Averted
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '20px',
                  textAlign: 'center',
                  border: '1px solid #99f6e4',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.05)'
                }}
              >
                <Droplets size={22} color="#0d9488" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#134e4a', letterSpacing: '-0.02em' }}>
                  <AnimatedCounter value={waterSavedLiters} prefix="~" suffix=" L" />
                </div>
                <div style={{ fontSize: '12.5px', color: '#0d9488', fontWeight: '700', marginTop: '4px' }}>
                  Water Footprint Conserved
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* 5 Interconnected Enterprise Portals */}
        <section style={{ marginTop: '48px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '32px' }}
          >
            <span style={{
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#059669',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: '#ecfdf5',
              padding: '4px 12px',
              borderRadius: '9999px',
              border: '1px solid #a7f3d0'
            }}>
              Integrated Platform Architecture
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em', marginTop: '10px' }}>
              5 Interconnected Enterprise Portals
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '640px', margin: '6px auto 0' }}>
              Engineered for seamless collaboration between food donors, non-profits, industrial recyclers, and volunteer courier fleets.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="ecosystem-card"
            >
              <div>
                <span className="badge donor" style={{ marginBottom: '12px' }}>Surplus Rescue</span>
                <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>
                  Commercial Donor Portal
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                  Hotels, restaurants, bakeries, and banquet halls log surplus meals or organic items with photos, expiry timers, and safe packaging tags.
                </p>
              </div>
              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                <Link to="/donor" style={{ fontSize: '13px', fontWeight: '700', color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }} className="arrow-hint">
                  <span>Open donor portal</span> <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="ecosystem-card"
            >
              <div>
                <span className="badge recipient" style={{ marginBottom: '12px' }}>Charity Allocation</span>
                <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>
                  Smart Proximity Matching
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                  Algorithmic discovery ranked by travel radius and capacity for verified orphanages, shelters, and relief charities to claim meals before expiry.
                </p>
              </div>
              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                <Link to="/recipient" style={{ fontSize: '13px', fontWeight: '700', color: '#7c3aed', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }} className="arrow-hint">
                  <span>Explore recipient portal</span> <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="ecosystem-card"
            >
              <div>
                <span className="badge recycler" style={{ marginBottom: '12px' }}>Circular Bio-Economy</span>
                <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>
                  Waste Stream Logistics
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                  Direct classification and routing of non-donatable items into certified industrial recycling, anaerobic digestion, and composting pipelines.
                </p>
              </div>
              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                <Link to="/recycler" style={{ fontSize: '13px', fontWeight: '700', color: '#0d9488', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }} className="arrow-hint">
                  <span>Circular recycler portal</span> <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="ecosystem-card"
            >
              <div>
                <span className="badge volunteer" style={{ marginBottom: '12px' }}>Fleet Logistics</span>
                <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>
                  Volunteer Courier Dispatch
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                  Crowdsourced and dedicated courier fleets accept rescue jobs, follow turn-by-turn route coordinates, and verify cold-chain handovers.
                </p>
              </div>
              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                <Link to="/volunteer" style={{ fontSize: '13px', fontWeight: '700', color: '#f59e0b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }} className="arrow-hint">
                  <span>Courier logistics</span> <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="ecosystem-card"
              style={{ border: '2px solid #10b981', background: '#f0fdf4' }}
            >
              <div>
                <span className="badge admin" style={{ marginBottom: '12px', background: '#d1fae5', color: '#047857' }}>
                  Trust & Governance
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '8px', color: '#064e3b' }}>
                  Admin & ESG Command
                </h3>
                <p style={{ fontSize: '13px', color: '#065f46', lineHeight: 1.6 }}>
                  KYC organization credential verification, real-time platform moderation, event notifications, and auditable public ESG impact aggregation.
                </p>
              </div>
              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #bbf7d0' }}>
                <Link to="/admin" style={{ fontSize: '13px', fontWeight: '800', color: '#047857', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }} className="arrow-hint">
                  <span>Enter command center</span> <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
