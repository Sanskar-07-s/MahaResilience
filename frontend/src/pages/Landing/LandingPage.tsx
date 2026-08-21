import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldAlert, Radio, Droplet, HeartPulse, Trash2, MapPin, FileSpreadsheet,
  Megaphone, ArrowRight, Shield, Activity, Users, Flame, Landmark, Sprout,
  GraduationCap, Bus, Compass, MessageSquare, CheckCircle, Bell, ChevronRight, Menu, X
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { useDisasterAlerts } from '../../contexts/AlertContext.tsx';
import { calculateLocationSafetyScore, SafetyScoreDetails } from '../../services/safetyScoreService.ts';
import { SUPER_ADMIN_UID_LOCAL, isSuperAdmin } from '../../utils/permissions.ts';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationCtx = useLocation();
  const { localAlerts, activeCriticalAlert } = useDisasterAlerts();

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firestore community posts & places state
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [touristPlaces, setTouristPlaces] = useState<any[]>([]);
  const [safetyScore, setSafetyScore] = useState<SafetyScoreDetails | null>(null);
  const [loadingScore, setLoadingScore] = useState(true);

  // Location display
  const districtName = locationCtx.district || 'Kolhapur';
  const locationSource = locationCtx.source ? locationCtx.source.toUpperCase() : 'MANUAL';

  // Load live community posts & tourism places
  useEffect(() => {
    const unsubPosts = onSnapshot(
      query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'), limit(3)),
      (snap) => setCommunityPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubPlaces = onSnapshot(
      query(collection(db, 'places'), limit(3)),
      (snap) => {
        const approved = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p: any) => p.status === 'approved' || !p.status);
        setTouristPlaces(approved);
      }
    );

    return () => {
      unsubPosts();
      unsubPlaces();
    };
  }, []);

  // Calculate real location safety score
  useEffect(() => {
    let isMounted = true;
    const fetchScore = async () => {
      setLoadingScore(true);
      const lat = locationCtx.latitude || 16.705;
      const lng = locationCtx.longitude || 74.2433;
      try {
        const result = await calculateLocationSafetyScore(lat, lng, districtName, locationCtx.city, locationCtx.ward);
        if (isMounted) setSafetyScore(result);
      } catch (_) {
        if (isMounted) setSafetyScore(null);
      } finally {
        if (isMounted) setLoadingScore(false);
      }
    };
    fetchScore();
    return () => {
      isMounted = false;
    };
  }, [locationCtx.latitude, locationCtx.longitude, districtName, locationCtx.city, locationCtx.ward]);

  const servicesGrid = [
    { name: 'Disaster EOC & Alerts', desc: 'Real-time emergency warnings and evacuation guidance.', icon: Radio, path: '/emergency', color: 'from-red-500/20 to-orange-500/20 text-red-400 border-red-500/30' },
    { name: 'Healthcare Services', desc: 'Find verified primary health centers & hospital beds.', icon: HeartPulse, path: '/healthcare', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30' },
    { name: 'Water & Tanker Booking', desc: 'Check water supply schedules & book municipal tankers.', icon: Droplet, path: '/water', color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30' },
    { name: 'Electricity Outage Control', desc: 'MSEDCL power outage announcements & hazard reports.', icon: ShieldAlert, path: '/electricity', color: 'from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30' },
    { name: 'Sanitation & Waste Pickup', desc: 'Track garbage collection schedules & report littering.', icon: Trash2, path: '/waste', color: 'from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30' },
    { name: 'APMC Agriculture Mandi', desc: 'Live crop mandi rates & expert agronomist advice.', icon: Sprout, path: '/agriculture', color: 'from-lime-500/20 to-green-500/20 text-lime-400 border-lime-500/30' },
    { name: 'Government Welfare Schemes', desc: 'Verified eligibility checking for Maharashtra schemes.', icon: Landmark, path: '/government', color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30' },
    { name: 'Educational Institutions', desc: 'Verified directory of schools, colleges & libraries.', icon: GraduationCap, path: '/education', color: 'from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30' },
    { name: 'Transit & Charging Nodes', desc: 'Public transit advisories & EV charging location map.', icon: Bus, path: '/transport', color: 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30' },
    { name: 'Tourism & Cultural Places', desc: 'Verified historic forts, temples & eco-tourism sites.', icon: Compass, path: '/tourism', color: 'from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30' },
    { name: 'Civic Grievance Reports', desc: 'File municipal complaints and track status in real-time.', icon: FileSpreadsheet, path: '/complaints', color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30' },
    { name: 'Community Discussions', desc: 'Connect, share verified updates & support your community.', icon: MessageSquare, path: '/community', color: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30' },
  ];

  const userIsSuperAdmin = isSuperAdmin(user) || user?.uid === SUPER_ADMIN_UID_LOCAL;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* A2 — TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="text-xl font-black text-white tracking-tight leading-none group-hover:text-emerald-400 transition-colors">
                MahaResilience
              </div>
              <div className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase mt-0.5">
                Safer Maharashtra, Stronger Together
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-extrabold tracking-wide uppercase text-slate-300">
            <Link to="/" className="text-emerald-400 hover:text-emerald-300 transition-colors">Home</Link>
            <a href="#services-section" className="hover:text-emerald-400 transition-colors">Services</a>
            <Link to="/emergency" className="hover:text-emerald-400 transition-colors">Alerts</Link>
            <Link to="/government" className="hover:text-emerald-400 transition-colors">Resources</Link>
            <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">Dashboard</Link>
            <Link to="/about" className="hover:text-emerald-400 transition-colors">About Us</Link>
          </nav>

          {/* User / Admin Action Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {userIsSuperAdmin ? (
              <Link
                to="/admin"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                👑 Master Admin Portal
              </Link>
            ) : user ? (
              <Link
                to="/profile"
                className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {user.name || 'Profile'}
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all"
              >
                Sign In / Register
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-3 text-xs font-bold text-slate-200">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-emerald-400">Home</Link>
            <a href="#services-section" onClick={() => setMobileMenuOpen(false)} className="block py-2">Services</a>
            <Link to="/emergency" onClick={() => setMobileMenuOpen(false)} className="block py-2">Alerts</Link>
            <Link to="/government" onClick={() => setMobileMenuOpen(false)} className="block py-2">Resources</Link>
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2">Dashboard</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block py-2">About Us</Link>
            {userIsSuperAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-yellow-400">👑 Master Admin Portal</Link>
            )}
          </div>
        )}
      </header>

      {/* A1 & A3 — CINEMATIC HERO SECTION MATCHING REFERENCE IMAGES */}
      <section className="relative min-h-[85vh] flex flex-col justify-between overflow-hidden bg-slate-950">
        {/* Background Image Layer inspired by Reference Image 1 */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url('/hero_bg.png')` }}
        >
          {/* Subtle dark overlay for maximum contrast and readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-12 w-full space-y-6">
          {/* Location Indicator */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold backdrop-blur-md shadow-lg">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>📍 Current Location: <strong className="text-white">{districtName}, Maharashtra</strong></span>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">Source: {locationSource}</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none drop-shadow-xl"
            >
              Building a Resilient <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Maharashtra
              </span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight drop-shadow-md"
            >
              Together, We Recover. Together, We Rise.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium max-w-2xl drop-shadow"
            >
              Real-time alerts, essential services, verified information and a strong community network — all in one platform for a safer and stronger Maharashtra.
            </motion.p>
          </div>

          {/* Primary & Secondary CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <button
              onClick={() => navigate('/emergency')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide uppercase shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2 hover-scale"
            >
              <Bell className="w-4 h-4 animate-bounce" />
              Get Real-Time Alerts
            </button>
            <a
              href="#services-section"
              className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 text-white font-black text-xs sm:text-sm border border-slate-700/80 backdrop-blur-md shadow-lg transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              Explore Services
            </a>
          </motion.div>
        </div>

        {/* A4 — FEATURE CARDS GRID MATCHING REFERENCE IMAGE 2 BOTTOM OVERLAY */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-8 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { title: 'Disaster Alerts', desc: 'Emergency notifications and verified disaster info', icon: Radio, path: '/emergency', color: 'border-red-500/40 text-red-400' },
              { title: 'Essential Services', desc: 'Water, electricity, healthcare, waste & more', icon: Droplet, path: '#services-section', color: 'border-emerald-500/40 text-emerald-400' },
              { title: 'Civic Complaints', desc: 'Report civic issues and track resolution', icon: MessageSquare, path: '/complaints', color: 'border-amber-500/40 text-amber-400' },
              { title: 'Tourism & Places', desc: 'Explore verified places and attractions', icon: Compass, path: '/tourism', color: 'border-teal-500/40 text-teal-400' },
              { title: 'Community Hub', desc: 'Connect, share and support your community', icon: Users, path: '/community', color: 'border-blue-500/40 text-blue-400' },
              { title: 'Safety & Preparedness', desc: 'Stay informed and prepare for any emergency', icon: Shield, path: '/dashboard', color: 'border-indigo-500/40 text-indigo-400' },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  onClick={() => card.path.startsWith('/') ? navigate(card.path) : window.location.hash = card.path}
                  className="bg-slate-950/70 hover:bg-slate-900/90 backdrop-blur-md border border-slate-800 hover:border-emerald-500/50 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className={`p-2 w-8 h-8 rounded-lg bg-slate-900 border ${card.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors leading-tight">
                      {card.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* A6 — LOCATION-AWARE ALERT PREVIEW SECTION */}
      <section className="py-12 bg-slate-900/50 border-y border-slate-800 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">GEOGRAPHICALLY SCOPED ALERT ENGINE</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Active Verified Bulletins for {districtName}</h2>
            </div>
            <Link to="/emergency" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
              View All Advisories <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {localAlerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localAlerts.slice(0, 2).map((alert) => (
                <div
                  key={alert.id || alert.title}
                  className={`p-4 rounded-2xl border ${
                    alert.severity === 'CRITICAL' ? 'bg-red-950/40 border-red-500/50' : 'bg-slate-900 border-slate-800'
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-500/20 text-red-300 uppercase">
                      {alert.severity} • {alert.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{new Date(alert.publishedDate).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">{alert.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{alert.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No active emergency affecting your current location ({districtName}).</h3>
              <p className="text-xs text-slate-400">Local emergency operations center monitoring status: Normal.</p>
            </div>
          )}
        </div>
      </section>

      {/* A7 — ESSENTIAL SERVICES DIRECTORY */}
      <section id="services-section" className="py-16 px-4 sm:px-8 space-y-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">MAHARASHTRA CIVIC SERVICES</span>
          <h2 className="text-3xl font-black text-white">Essential Services Directory</h2>
          <p className="text-xs text-slate-400">Instant access to verified civic utilities, public healthcare, emergency dispatch and government services.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {servicesGrid.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.name}
                onClick={() => navigate(s.path)}
                className={`p-5 rounded-2xl bg-gradient-to-b ${s.color} border hover:scale-102 transition-all cursor-pointer space-y-3 flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="p-3 w-10 h-10 rounded-xl bg-slate-950/60 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-white">{s.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
                </div>
                <div className="pt-2 text-[11px] font-bold text-white flex items-center gap-1">
                  Access Service <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* A8 — SAFETY & RESILIENCE SCORE SECTION */}
      <section className="py-12 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-y border-slate-800 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">REAL-TIME CIVIC SAFETY ANALYTICS</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Location Resilience Index</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Calculated dynamically using verified local hazard count, objective disaster metrics, and emergency response proximity for {districtName}.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-6 shadow-xl">
            {loadingScore ? (
              <div className="text-xs text-slate-400 animate-pulse">Calculating safety index...</div>
            ) : safetyScore && safetyScore.score !== null ? (
              <>
                <div className="text-center">
                  <div className="text-4xl font-black text-emerald-400">{safetyScore.score}/100</div>
                  <div className="text-[10px] font-bold uppercase text-emerald-300 mt-0.5">{safetyScore.zoneLabel}</div>
                </div>
                <div className="h-12 w-px bg-slate-800" />
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-white">{safetyScore.statusMessage}</div>
                  <div className="text-[10px] text-slate-400">Confidence: {(safetyScore.confidence * 100).toFixed(0)}%</div>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Safety score unavailable due to insufficient verified data.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* A9 & A10 — COMMUNITY & TOURISM PREVIEWS */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
        {/* Community Posts Stream */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">CITIZEN NETWORK</span>
              <h2 className="text-2xl font-black text-white">Recent Community Discussions</h2>
            </div>
            <Link to="/community" className="text-xs font-bold text-emerald-400 hover:underline">
              Join Community →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {communityPosts.length > 0 ? (
              communityPosts.map((post) => (
                <div key={post.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase">{post.category || 'General'}</div>
                  <h3 className="text-sm font-bold text-white leading-snug">{post.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{post.content}</p>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                No community posts yet. Start the first discussion in your area!
              </div>
            )}
          </div>
        </div>

        {/* Tourist Places Stream */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-teal-400 tracking-wider">EXPLORE MAHARASHTRA</span>
              <h2 className="text-2xl font-black text-white">Verified Heritage & Tourist Places</h2>
            </div>
            <Link to="/tourism" className="text-xs font-bold text-teal-400 hover:underline">
              Explore All Places →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {touristPlaces.length > 0 ? (
              touristPlaces.map((place) => (
                <div key={place.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden space-y-3">
                  {place.imageUrl && (
                    <img src={place.imageUrl} alt={place.name} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-4 space-y-1">
                    <h3 className="text-sm font-bold text-white">{place.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{place.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                Explore local fortresses, temples and eco-tourism sites across Maharashtra.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* A11 — FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="text-lg font-black text-white">MahaResilience</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Unified Disaster Management, Civic Infrastructure & Community Resilience Platform for Maharashtra.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-2">Essential Utilities</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/emergency" className="hover:text-emerald-400">Disaster EOC</Link></li>
              <li><Link to="/healthcare" className="hover:text-emerald-400">Healthcare Facilities</Link></li>
              <li><Link to="/water" className="hover:text-emerald-400">Water Tanker Supply</Link></li>
              <li><Link to="/electricity" className="hover:text-emerald-400">Electricity Outages</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-2">Public Services</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/government" className="hover:text-emerald-400">Government Schemes</Link></li>
              <li><Link to="/complaints" className="hover:text-emerald-400">Civic Complaints</Link></li>
              <li><Link to="/tourism" className="hover:text-emerald-400">Tourism & Places</Link></li>
              <li><Link to="/community" className="hover:text-emerald-400">Community Network</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-2">Official Resources</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Disaster alerts cross-referenced with Maharashtra State Disaster Management Authority (MSDMA) & SACHET NDMA portal datasets.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-900 mt-8 pt-6 flex justify-between items-center text-[10px]">
          <div>© {new Date().getFullYear()} MahaResilience. All Rights Reserved.</div>
          <div>Built for a Safer & Stronger Maharashtra</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
