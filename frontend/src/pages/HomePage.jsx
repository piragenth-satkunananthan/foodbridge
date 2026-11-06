import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Utensils,
  Recycle,
  Truck,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Thermometer,
  MapPin,
  HeartHandshake,
  FileCheck,
  ChevronRight,
  Sparkles,
  Info,
  Navigation,
  Scale,
  Zap,
  Check,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchPublicImpact, fetchLiveFeed, fetchDistrictStats } from '../api/client';

const ROLES = [
  {
    id: 'donor',
    name: 'Commercial Donor',
    badge: 'Surplus & Waste',
    audience: 'Hotels, Caterers, Supermarkets, Bakeries, Event Halls',
    summary: 'List hot/chilled prepared meals or post organic and recyclable waste in under 90 seconds.',
    icon: Utensils,
    iconColor: 'bg-emerald-50 text-emerald-600',
    borderColor: 'hover:border-emerald-500',
    link: '/donor',
    ctaText: 'Donor Portal'
  },
  {
    id: 'recipient',
    name: 'Charity & Shelter',
    badge: 'Food Security',
    audience: 'Registered Care Homes, Orphanages, Community Kitchens',
    summary: 'Browse and claim nearby surplus food matched automatically to your verified refrigerator capacity.',
    icon: HeartHandshake,
    iconColor: 'bg-blue-50 text-blue-600',
    borderColor: 'hover:border-blue-500',
    link: '/recipient',
    ctaText: 'Recipient Portal'
  },
  {
    id: 'recycler',
    name: 'Circular Recycler',
    badge: 'Resource Recovery',
    audience: 'Commercial Composters, Bio-gas Digesters, Material Processors',
    summary: 'Claim segregated kitchen trimmings, glass bottles, metal scrap, and cardboard for processing.',
    icon: Recycle,
    iconColor: 'bg-amber-50 text-amber-600',
    borderColor: 'hover:border-amber-500',
    link: '/recycler',
    ctaText: 'Recycler Portal'
  },
  {
    id: 'volunteer',
    name: 'Volunteer Courier',
    badge: 'Last-Mile Transport',
    audience: 'Motorbike Riders, Three-Wheeler Drivers, Car & Van Owners',
    summary: 'Accept local time-sensitive delivery runs to transport food safely within your neighborhood.',
    icon: Truck,
    iconColor: 'bg-indigo-50 text-indigo-600',
    borderColor: 'hover:border-indigo-500',
    link: '/volunteer',
    ctaText: 'Volunteer Portal'
  },
  {
    id: 'admin',
    name: 'Governance Admin',
    badge: 'Safety & Verification',
    audience: 'Platform Coordinators, Food Safety Reviewers, District Leads',
    summary: 'Audit stakeholder credentials, monitor active cold-chain missions, and certify impact records.',
    icon: ShieldCheck,
    iconColor: 'bg-purple-50 text-purple-600',
    borderColor: 'hover:border-purple-500',
    link: '/admin',
    ctaText: 'Admin Command'
  }
];

const DISTRICT_HUBS = [
  { id: 'colombo', name: 'Colombo', province: 'Western', radius: '6.5 km avg', hubs: 'Colombo 01-15, Dehiwala, Moratuwa', ready: 'High Density Logistics', response: '18 min' },
  { id: 'gampaha', name: 'Gampaha', province: 'Western', radius: '8.2 km avg', hubs: 'Negombo, Kelaniya, Wattala', ready: 'Active Courier Hub', response: '24 min' },
  { id: 'kandy', name: 'Kandy', province: 'Central', radius: '7.0 km avg', hubs: 'Kandy City, Peradeniya, Katugastota', ready: 'Bio-composting Ready', response: '22 min' },
  { id: 'galle', name: 'Galle', province: 'Southern', radius: '5.8 km avg', hubs: 'Galle Fort, Karapitiya, Hikkaduwa', ready: 'Hospitality Rescue Core', response: '19 min' },
  { id: 'jaffna', name: 'Jaffna', province: 'Northern', radius: '9.4 km avg', hubs: 'Jaffna Town, Nallur, Chavakachcheri', ready: 'Community Network Active', response: '28 min' },
  { id: 'batticaloa', name: 'Batticaloa', province: 'Eastern', radius: '8.0 km avg', hubs: 'Batticaloa Town, Kattankudy, Eravur', ready: 'Agricultural Routing', response: '26 min' },
  { id: 'kurunegala', name: 'Kurunegala', province: 'North Western', radius: '8.5 km avg', hubs: 'Kurunegala Town, Kuliyapitiya, Narammala', ready: 'Regional Central Depot', response: '25 min' },
  { id: 'anuradhapura', name: 'Anuradhapura', province: 'North Central', radius: '10.2 km avg', hubs: 'New Town, Sacred City, Medawachchiya', ready: 'Agricultural Surplus Hub', response: '30 min' }
];

const FAQS = [
  {
    q: 'Is FoodBridge completely free for donors and charities?',
    a: 'Yes. FoodBridge is 100% free open civic infrastructure. We charge zero platform fees, zero matching commissions, and zero delivery charges.'
  },
  {
    q: 'How does FoodBridge protect food safety and temperature compliance?',
    a: 'Donors must declare preparation timestamps and storage condition (chilled ≤5°C, hot-holding ≥60°C, or ambient). Pickups have strict expiration windows, and recipients inspect cargo condition before signing the two-party receipt.'
  },
  {
    q: 'Why are non-profit charities and recyclers required to be verified?',
    a: 'To guarantee that edible food reaches genuine vulnerable beneficiaries and that waste materials reach licensed facilities, administrators verify organization registration documents prior to unlocking claims.'
  },
  {
    q: 'What vehicles can participate in the volunteer courier fleet?',
    a: 'Any roadworthy vehicle in Sri Lanka: motorbikes with thermal backpacks, three-wheelers (tuk-tuks) with crate space, cars, and utility vans.'
  },
  {
    q: 'How are platform impact figures calculated?',
    a: 'All reported metrics derive strictly from completed, two-party verified deliveries. We explicitly avoid unverified carbon credits or speculative tree figures.'
  }
];

export default function HomePage() {
  const { user } = useAuth();
  const [selectedDistrict, setSelectedDistrict] = useState(DISTRICT_HUBS[0]);
  const [openFaq, setOpenFaq] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [districtStats, setDistrictStats] = useState({});
  const [liveFeed, setLiveFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingImpact, setLoadingImpact] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetchPublicImpact(),
      fetchLiveFeed(),
      fetchDistrictStats()
    ]).then(([impactRes, feedRes, districtRes]) => {
      if (impactRes.status === 'fulfilled' && impactRes.value) {
        setImpactData(impactRes.value);
      }
      if (feedRes.status === 'fulfilled' && feedRes.value?.items) {
        setLiveFeed(feedRes.value.items);
      }
      if (districtRes.status === 'fulfilled' && districtRes.value?.districts) {
        setDistrictStats(districtRes.value.districts);
      }
      setLoadingFeed(false);
      setLoadingImpact(false);
    }).catch(() => {
      setLoadingFeed(false);
      setLoadingImpact(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900">
      {/* 1. Hero Section (Option A: The Public Record Office Civic Architecture) */}
      <section className="relative pt-10 pb-16 lg:pt-14 lg:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column (7 cols): Editorial Authority */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Civic Principle Badge with live pulse dot */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#f0f6f1] text-[#163e32] border border-[#d4e5d8]">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <span>Sri Lanka’s Civic Food Rescue &amp; Circular Waste Network</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-950 tracking-[-0.035em] leading-[1.08]">
              Surplus food to hungry tables.<br />
              <span className="text-[#3c7959]">Organic waste to clean soil.</span>
            </h1>

            {/* High-Contrast Subtitle */}
            <p className="text-base sm:text-lg text-[#48675c] max-w-xl leading-relaxed font-normal tracking-[-0.012em]">
              A real-time logistics platform connecting commercial kitchens, verified shelters, industrial composters, and volunteer couriers across all 25 Sri Lankan districts.
            </p>

            {/* Actions: Primary Forest + Explanatory Warm Yellow (Yellow Fence Rule) */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={user ? `/${user.role}` : '/register?role=donor'}
                className="px-6 py-3 rounded-lg bg-[#167347] hover:bg-[#105b37] text-white font-bold text-sm border border-emerald-900/20 shadow-xs transition-all flex items-center gap-2"
              >
                <span>{user ? 'Open Dashboard' : 'Donate Food Surplus'}</span>
                <ArrowRight size={16} />
              </Link>
              <a
                href="#how-it-works"
                className="px-5 py-3 rounded-lg bg-[#f5de87] hover:bg-[#ead077] text-[#163e32] font-bold text-sm border border-[#e0c86e] transition-all flex items-center gap-2"
              >
                <span>See How It Works</span>
              </a>
              <Link
                to="/register?role=volunteer"
                className="px-4 py-3 rounded-lg text-slate-700 hover:text-slate-950 font-bold text-sm transition-colors"
              >
                Become a Courier
              </Link>
            </div>

            {/* Verification Trust Signals */}
            <div className="pt-6 border-t border-slate-200/90 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#167347] shrink-0" />
                <span>Two-Party Sign-Off</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#167347] shrink-0" />
                <span>KYC-Verified Partners</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#167347] shrink-0" />
                <span>25 District Hubs</span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): The Signature 5-Role Directory Panel */}
          <div className="lg:col-span-5">
            <div className="bg-[#edf5ee] border border-[#cce0d2] rounded-2xl p-6 sm:p-7 text-left">
              <div className="mb-4 pb-4 border-b border-[#c5d8c9]/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#3c7959] block mb-1">
                  Community Directory
                </span>
                <h3 className="text-xl font-black text-[#163e32] tracking-tight">
                  Select Your Role to Enter
                </h3>
                <p className="text-xs text-[#48675c] mt-0.5">
                  Direct entry into specialized logistics and coordination portals
                </p>
              </div>

              <nav className="divide-y divide-[#c5d8c9]" aria-label="Role Directory">
                {/* 1. Food Donors */}
                <Link
                  to={user ? `/${user.role}` : '/register?role=donor'}
                  className="group flex items-center justify-between py-3.5 px-3 -mx-3 rounded-lg hover:bg-[#dfecdf] transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#163e32]">Food Donors</span>
                      <span className="text-[10px] font-bold bg-[#e1eee4] text-[#163e32] px-1.5 py-0.5 rounded">Commercial</span>
                    </div>
                    <p className="text-xs text-[#48675c] mt-0.5">Hotels, caterers, supermarkets, bakeries</p>
                  </div>
                  <ArrowUpRight size={18} className="text-[#3c7959] group-hover:text-[#163e32] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 ml-2" />
                </Link>

                {/* 2. Shelters & Charities */}
                <Link
                  to={user ? `/${user.role}` : '/register?role=recipient'}
                  className="group flex items-center justify-between py-3.5 px-3 -mx-3 rounded-lg hover:bg-[#dfecdf] transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#163e32]">Shelters &amp; Charities</span>
                      {impactData?.ecosystem?.verifiedNGOs ? (
                        <span className="text-[10px] font-bold bg-emerald-100/90 text-emerald-900 px-1.5 py-0.5 rounded">
                          {impactData.ecosystem.verifiedNGOs} Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-[#e1eee4] text-[#163e32] px-1.5 py-0.5 rounded">Relief</span>
                      )}
                    </div>
                    <p className="text-xs text-[#48675c] mt-0.5">Registered care homes, orphanages, welfare</p>
                  </div>
                  <ArrowUpRight size={18} className="text-[#3c7959] group-hover:text-[#163e32] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 ml-2" />
                </Link>

                {/* 3. Volunteer Couriers */}
                <Link
                  to={user ? `/${user.role}` : '/register?role=volunteer'}
                  className="group flex items-center justify-between py-3.5 px-3 -mx-3 rounded-lg hover:bg-[#dfecdf] transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#163e32]">Volunteer Couriers</span>
                      {impactData?.ecosystem?.activeVolunteers ? (
                        <span className="text-[10px] font-bold bg-emerald-100/90 text-emerald-900 px-1.5 py-0.5 rounded">
                          {impactData.ecosystem.activeVolunteers} Fleet
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-[#e1eee4] text-[#163e32] px-1.5 py-0.5 rounded">Transport</span>
                      )}
                    </div>
                    <p className="text-xs text-[#48675c] mt-0.5">Motorbike, three-wheeler, car &amp; van fleet</p>
                  </div>
                  <ArrowUpRight size={18} className="text-[#3c7959] group-hover:text-[#163e32] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 ml-2" />
                </Link>

                {/* 4. Certified Recyclers */}
                <Link
                  to={user ? `/${user.role}` : '/register?role=recycler'}
                  className="group flex items-center justify-between py-3.5 px-3 -mx-3 rounded-lg hover:bg-[#dfecdf] transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#163e32]">Certified Recyclers</span>
                      {impactData?.ecosystem?.verifiedRecyclers ? (
                        <span className="text-[10px] font-bold bg-amber-100/90 text-amber-900 px-1.5 py-0.5 rounded">
                          {impactData.ecosystem.verifiedRecyclers} Facilities
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-[#e1eee4] text-[#163e32] px-1.5 py-0.5 rounded">Circular</span>
                      )}
                    </div>
                    <p className="text-xs text-[#48675c] mt-0.5">Commercial composters, bio-gas &amp; processors</p>
                  </div>
                  <ArrowUpRight size={18} className="text-[#3c7959] group-hover:text-[#163e32] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 ml-2" />
                </Link>

                {/* 5. District Governance */}
                <Link
                  to="/admin"
                  className="group flex items-center justify-between py-3.5 px-3 -mx-3 rounded-lg hover:bg-[#dfecdf] transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#163e32]">District Governance</span>
                      <span className="text-[10px] font-bold bg-[#e1eee4] text-[#163e32] px-1.5 py-0.5 rounded">Audited</span>
                    </div>
                    <p className="text-xs text-[#48675c] mt-0.5">Public health officers, coordinators &amp; admins</p>
                  </div>
                  <ArrowUpRight size={18} className="text-[#3c7959] group-hover:text-[#163e32] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 ml-2" />
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </section>

      {/* Real Database Impact Metrics Strip */}
      <section className="border-y border-slate-200/90 bg-white py-7 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {loadingImpact ? '...' : (impactData?.summary?.mealsRescued || 0).toLocaleString()}
              </div>
              <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Meals Rescued
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-800 tabular-nums">
                {loadingImpact ? '...' : `${(impactData?.summary?.kgOrganicDiverted || 0).toLocaleString()} kg`}
              </div>
              <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Organic Diverted
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 tabular-nums">
                {loadingImpact ? '...' : `${(impactData?.summary?.totalKgRecycled || 0).toLocaleString()} kg`}
              </div>
              <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Packaging Recycled
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {loadingImpact ? '...' : (impactData?.ecosystem?.verifiedNGOs || 0)}
              </div>
              <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Verified Charities
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {loadingImpact ? '...' : `${impactData?.summary?.districtsCoveredCount || 0} / 25`}
              </div>
              <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Active Districts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Dual-Stream Architecture Cards */}
      <section id="streams" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Two Distinct Streams. Zero Contamination.
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            FoodBridge strictly separates edible food from inedible waste to ensure dignified nutrition for families and pure feedstock for recyclers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stream 1: Edible Surplus */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-7 shadow-xs hover:shadow-sm hover:border-emerald-300 transition-all relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5 border border-emerald-100">
                <Utensils size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                Stream 01 • Human Nutrition
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Edible Surplus Food
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Unserved banquet trays, bakery overstocks, fresh market produce, and packaged groceries safely redirected to community kitchens and care homes before spoilage.
              </p>

              <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 rounded-lg p-4 border border-slate-200/70">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-700 shrink-0" />
                  <span>Strict time limits: Picked up within 2 to 4 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-700 shrink-0" />
                  <span>Temperature compliance: Hot ≥60°C or Chilled ≤5°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-700 shrink-0" />
                  <span>Delivered exclusively to verified charities with zero resale</span>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-6 border-t border-slate-100">
              <Link
                to="/donor"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <span>Post Edible Surplus</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Stream 2: Inedible Waste */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-7 shadow-xs hover:shadow-sm hover:border-amber-300 transition-all relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-5 border border-amber-100">
                <Recycle size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-1">
                Stream 02 • Circular Upcycling
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Organic Waste &amp; Packaging
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Kitchen prep trimmings, spoiled produce, cardboard boxes, PET plastic, and glass cullet collected at source and delivered to commercial composters and certified recyclers.
              </p>

              <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 rounded-lg p-4 border border-slate-200/70">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-amber-700 shrink-0" />
                  <span>5 segregated streams: organic, plastic, glass, paper, metal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-amber-700 shrink-0" />
                  <span>Enriched organic compost and bio-gas generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-amber-700 shrink-0" />
                  <span>Audited diversion certificates issued directly by facilities</span>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-6 border-t border-slate-100">
              <Link
                to="/recycler"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                <span>Explore Recycler Network</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 4-Stage Verified Custody Protocol */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How FoodBridge Works
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            A 4-step verified chain of custody replacing informal handovers with auditable digital tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200/60">
              01
            </div>
            <h4 className="font-bold text-base text-slate-900">List Surplus</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Donors input food details, portion quantities, preparation time, and storage temperature in seconds.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200/60">
              02
            </div>
            <h4 className="font-bold text-base text-slate-900">Smart Proximity Match</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              The matching algorithm automatically alerts the closest verified shelter with matching refrigerator space.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200/60">
              03
            </div>
            <h4 className="font-bold text-base text-slate-900">Volunteer Courier Run</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              A community courier accepts the route, picks up the insulated containers, and transports them safely.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200/60">
              04
            </div>
            <h4 className="font-bold text-base text-slate-900">Receipt Sign-Off</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              The receiving shelter inspects the food condition and confirms digital sign-off, closing the loop.
            </p>
          </div>
        </div>
      </section>

      {/* 4. The 5 Community Stakeholder Portals */}
      <section id="portals" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tailored Portals for Every Stakeholder
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Dedicated dashboards engineered specifically for commercial kitchens, charities, recyclers, couriers, and administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg ${role.iconColor} flex items-center justify-center border border-slate-100`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {role.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {role.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mb-2.5">
                    {role.audience}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {role.summary}
                  </p>
                </div>

                <Link
                  to={role.link}
                  className="w-full py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>{role.ctaText}</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. 25 Districts Island-Wide Explorer */}
      <section id="districts" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200/90 p-7 sm:p-9 shadow-xs">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              National Reach
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Coordinating Across 25 Districts
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              FoodBridge decentralizes logistics into local radius clusters, keeping transit times under 30 minutes in tropical heat.
            </p>
          </div>

          {/* District Selector Chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {DISTRICT_HUBS.map((dist) => (
              <button
                key={dist.id}
                onClick={() => setSelectedDistrict(dist)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedDistrict.id === dist.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {dist.name}
              </button>
            ))}
          </div>

          {/* Selected District Info Card (Database-Backed) */}
          <div className="bg-slate-50/80 rounded-xl p-6 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-4 gap-6 text-center sm:text-left">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Active Cluster</span>
              <h4 className="text-base font-bold text-slate-900">{selectedDistrict.name} Hub</h4>
              <p className="text-xs text-slate-500 mt-1">{selectedDistrict.hubs}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Verified Charities</span>
              <div className="text-2xl font-bold tabular-nums text-emerald-800">
                {districtStats[selectedDistrict.name]?.organizations || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Active registered partners</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Active Couriers</span>
              <div className="text-2xl font-bold tabular-nums text-indigo-700">
                {districtStats[selectedDistrict.name]?.volunteers || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Community transit fleet</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Surplus Dispatched</span>
              <div className="text-2xl font-bold tabular-nums text-slate-900">
                {districtStats[selectedDistrict.name]?.donations || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Logged donations</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Live Activity Stream (Database-Backed Real MongoDB Feed) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
            Real-Time Network Feed
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Recent Deliveries &amp; Diversions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Real-time feed of completed deliveries and material intakes logged across the island from our database.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs max-w-3xl mx-auto space-y-3">
          {loadingFeed ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading live activity feed from database...</div>
          ) : liveFeed.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No recent public milestones recorded yet today. Active deliveries appear here once completed.
            </div>
          ) : (
            liveFeed.slice(0, 6).map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.type === 'food' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 font-semibold">{item.itemTitle}</strong>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                        {item.quantity}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      From {item.origin} • {item.district} District • {item.spec}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    item.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {item.status ? item.status.toUpperCase() : 'RECORDED'}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 7. FAQ Accordion */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4.5 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-900 cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. Bottom CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 text-white p-8 sm:p-14 text-center relative overflow-hidden shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-xl mx-auto text-white">
            Ready to eliminate food waste in your community?
          </h2>
          <p className="mt-4 text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Register your commercial kitchen, shelter, or join the volunteer transport fleet today. 100% free open civic infrastructure.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-xs transition-colors"
            >
              Register for FoodBridge
            </Link>
            <Link
              to="/impact"
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-colors"
            >
              View Audited Impact
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
