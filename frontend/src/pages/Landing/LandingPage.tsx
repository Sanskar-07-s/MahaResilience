import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Bell,
  MapPin,
  Radio,
  Droplets,
  MessageSquare,
  Camera,
  Users,
  ShieldCheck,
  Flame,
  Award,
  HeartPulse,
  Trash2,
  Sprout,
  GraduationCap,
  Bus,
  Compass,
  Zap,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Megaphone,
  LogIn,
  ChevronDown,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { AIAssistantDrawer } from '../../components/ai/AIAssistantDrawer.tsx';

// Floating Particle Component for rich ambient environment
const FloatingParticle: React.FC<{ delay: number; duration: number; x: number; y: number; size: number }> = ({
  delay,
  duration,
  x,
  y,
  size,
}) => (
  <motion.div
    initial={{ opacity: 0, y: y + 30, x }}
    animate={{
      opacity: [0, 0.7, 0.2, 0.8, 0],
      y: [y + 30, y - 60, y - 120],
      x: [x, x + (Math.random() * 40 - 20), x],
      scale: [0.8, 1.2, 0.9],
    }}
    transition={{
      duration,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
    className="absolute pointer-events-none rounded-full bg-gradient-to-tr from-amber-300 via-emerald-300 to-teal-200 blur-[1px]"
    style={{
      width: size,
      height: size,
      left: `${x}%`,
      top: `${y}%`,
    }}
  />
);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { ward, city, district } = useLocation();
  const { user } = useAuth();
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<'Home' | 'Services' | 'Alerts' | 'Resources' | 'Dashboard' | 'About Us'>('Home');

  const bottomFeatureCards = [
    {
      id: 'alerts',
      icon: Radio,
      title: 'Disaster Alerts',
      desc: 'Instant notifications & live warnings',
      path: '/alerts',
      badge: 'Live EOC',
      badgeColor: 'bg-red-500/30 text-red-200 border-red-400/40',
      iconColor: 'text-red-300 bg-red-500/20 border-red-400/30',
    },
    {
      id: 'services',
      icon: Droplets,
      title: 'Essential Services',
      desc: 'Water, Electricity & Healthcare',
      path: '#services-section',
      badge: 'Utilities',
      badgeColor: 'bg-blue-500/30 text-blue-200 border-blue-400/40',
      iconColor: 'text-blue-300 bg-blue-500/20 border-blue-400/30',
    },
    {
      id: 'complaints',
      icon: MessageSquare,
      title: 'Civic Complaints',
      desc: 'Report issues & track resolution',
      path: '/complaints',
      badge: 'Grievance',
      badgeColor: 'bg-amber-500/30 text-amber-200 border-amber-400/40',
      iconColor: 'text-amber-300 bg-amber-500/20 border-amber-400/30',
    },
    {
      id: 'tourism',
      icon: Camera,
      title: 'Tourism & Places',
      desc: 'Explore historic forts & attractions',
      path: '/tourism',
      badge: 'Heritage',
      badgeColor: 'bg-teal-500/30 text-teal-200 border-teal-400/40',
      iconColor: 'text-teal-300 bg-teal-500/20 border-teal-400/30',
    },
    {
      id: 'community',
      icon: Users,
      title: 'Community Hub',
      desc: 'Connect & support neighborhood',
      path: '/community',
      badge: 'Network',
      badgeColor: 'bg-purple-500/30 text-purple-200 border-purple-400/40',
      iconColor: 'text-purple-300 bg-purple-500/20 border-purple-400/30',
    },
    {
      id: 'safety',
      icon: ShieldCheck,
      title: 'Safety & Defense',
      desc: 'Be prepared for any emergency',
      path: '/emergency',
      badge: 'Rescue',
      badgeColor: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40',
      iconColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-400/30',
    },
  ];

  const civicServices = [
    { name: 'Disaster EOC & SOS', desc: 'Real-time cyclone, flood & evacuation warnings with 1-click SOS.', icon: Flame, color: 'text-red-600 bg-red-50 border-red-200', path: '/emergency' },
    { name: 'Government Schemes', desc: 'Eligibility checks for Ladki Bahin, PM-Kisan & Maharashtra DBT.', icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-200', path: '/government' },
    { name: 'Civic Grievance Desk', desc: 'Lodge tickets for potholes, streetlights, and drainage issues.', icon: MessageSquare, color: 'text-amber-600 bg-amber-50 border-amber-200', path: '/complaints' },
    { name: 'Emergency Healthcare', desc: 'Live ICU/Oxygen bed availability and 24x7 Civil Hospital registry.', icon: HeartPulse, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', path: '/healthcare' },
    { name: 'Water & Tanker Booking', desc: 'Reservoir telemetry, tanker dispatch and supply disruption alerts.', icon: Droplets, color: 'text-blue-600 bg-blue-50 border-blue-200', path: '/water' },
    { name: 'MSEDCL Grid & Outages', desc: 'Real-time power outage schedules, feeder load and hazard reports.', icon: Zap, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', path: '/electricity' },
    { name: 'Sanitation & SWM Fleet', desc: 'Garbage compactor tracking, recycling and blackspot reporting.', icon: Trash2, color: 'text-teal-600 bg-teal-50 border-teal-200', path: '/waste' },
    { name: 'APMC Agriculture Mandi', desc: 'Daily market commodity rates and CIBRC approved pest remedies.', icon: Sprout, color: 'text-green-600 bg-green-50 border-green-200', path: '/agriculture' },
    { name: 'Education & Public ITIs', desc: 'Verified directory of schools, colleges, grants and public libraries.', icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', path: '/education' },
    { name: 'Transit & EV Fast Hubs', desc: 'MSRTC live bus telemetry, highway ghat advisories & EV charging.', icon: Bus, color: 'text-cyan-600 bg-cyan-50 border-cyan-200', path: '/transport' },
    { name: 'Forts & Cultural Heritage', desc: 'Verified historic forts, ancient temples & scenic eco-spots.', icon: Compass, color: 'text-teal-600 bg-teal-50 border-teal-200', path: '/tourism' },
    { name: 'Community Discussions', desc: 'Connect, share verified updates & support your neighborhood.', icon: Users, color: 'text-rose-600 bg-rose-50 border-rose-200', path: '/community' },
  ];

  const handleCardClick = (path: string) => {
    if (path.startsWith('#')) {
      const elem = document.querySelector(path);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (path === '/alerts' || path === '/emergency' || path === '/dashboard') {
      if (!user) {
        navigate('/login');
      } else {
        navigate(path);
      }
    } else {
      navigate(path);
    }
  };

  const handleAlertsClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/alerts');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      {/* ─── FULLSCREEN HERO CONTAINER WITH BACKGROUND ────────────────────── */}
      <div
        className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/hero_bg.png')` }}
      >
        {/* Subtle Ambient Lighting & Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-transparent to-black/70 pointer-events-none" />

        {/* Ambient Animated Particles in Sky / Landscape */}
        <FloatingParticle delay={0} duration={6} x={25} y={15} size={6} />
        <FloatingParticle delay={1.5} duration={7} x={75} y={20} size={8} />
        <FloatingParticle delay={2} duration={8} x={45} y={35} size={5} />
        <FloatingParticle delay={3} duration={6.5} x={85} y={45} size={7} />
        <FloatingParticle delay={0.8} duration={7.5} x={15} y={50} size={6} />

        {/* ─── TOP GLASS FLOATING NAVBAR (ANIMATED) ─────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between"
        >
          {/* Brand Logo & Tagline */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            {/* 4-Quadrant Shield Emblem with 3D Float */}
            <motion.div
              whileHover={{ rotate: [0, -6, 6, 0], scale: 1.1 }}
              transition={{ duration: 0.45 }}
              className="w-11 h-11 rounded-2xl bg-white/95 border border-emerald-600/30 p-1.5 shadow-lg flex flex-wrap items-center justify-center gap-0.5 shrink-0 backdrop-blur-md group-hover:shadow-emerald-500/30 transition-shadow"
            >
              <div className="w-3.5 h-3.5 rounded-sm bg-blue-500 flex items-center justify-center text-[8px] text-white">💧</div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500 flex items-center justify-center text-[8px] text-white">🌱</div>
              <div className="w-3.5 h-3.5 rounded-sm bg-amber-500 flex items-center justify-center text-[8px] text-white">👥</div>
              <div className="w-3.5 h-3.5 rounded-sm bg-teal-600 flex items-center justify-center text-[8px] text-white">🛡️</div>
            </motion.div>

            <div>
              <h1 className="font-black text-[#0f2c59] text-xl tracking-tight leading-tight flex items-center">
                Maha<span className="text-emerald-700">Resilience</span>
              </h1>
              <span className="text-[11px] text-slate-800 font-bold tracking-wide block">
                Safer Maharashtra, Stronger Together
              </span>
            </div>
          </div>

          {/* Navigation Links with Hover Pill Effect */}
          <nav className="hidden md:flex items-center gap-7 bg-white/55 hover:bg-white/80 backdrop-blur-md px-7 py-2.5 rounded-full border border-white/80 shadow-md text-sm font-bold text-slate-800 transition-all duration-300">
            {[
              { name: 'Home', action: () => navigate('/') },
              { name: 'Services', action: () => handleCardClick('#services-section') },
              { name: 'Alerts', action: () => handleAlertsClick() },
              { name: 'Resources', action: () => navigate('/government') },
              { name: 'Dashboard', action: () => handleCardClick('/dashboard') },
              { name: 'About Us', action: () => handleCardClick('#about-section') },
            ].map((item) => (
              <motion.button
                key={item.name}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveNav(item.name as any);
                  item.action();
                }}
                className={`transition-colors relative py-1 hover:text-emerald-900 ${
                  activeNav === item.name
                    ? 'text-emerald-900 font-extrabold border-b-2 border-emerald-600'
                    : 'text-slate-800'
                }`}
              >
                {item.name}
              </motion.button>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <motion.button
              whileHover={{ scale: 1.08, boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)' }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setIsAiDrawerOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/90 hover:bg-white text-emerald-900 rounded-full text-xs font-black border border-emerald-600/30 shadow-md backdrop-blur-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>Gemini AI</span>
            </motion.button>

            {user ? (
              <motion.button
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-[#0f2c59] hover:bg-[#0c2340] text-white rounded-full text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                My Account
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-[#0f2c59] hover:bg-[#0c2340] text-white rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </motion.button>
            )}
          </div>
        </motion.header>

        {/* ─── HERO MAIN CONTENT WITH STAGGER ANIMATIONS ─────────────────────── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="max-w-2xl space-y-4">
            {/* Live Indicator Pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-emerald-500/30 text-xs font-bold text-emerald-900 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Active Sentinel Network • {ward || city || 'Statewide'}, {district || 'Maharashtra'}</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0c2340] tracking-tight leading-[1.1] drop-shadow-sm"
            >
              Building a <br />
              <span className="bg-gradient-to-r from-[#0c2340] via-[#103b6d] to-[#0c2340] bg-clip-text text-transparent">
                Resilient Maharashtra
              </span>
            </motion.h1>

            {/* Subheading with glowing gradient */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#157948] tracking-tight leading-snug drop-shadow-sm"
            >
              Together, We Recover. <br />
              Together, We Rise.
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed max-w-xl pt-2"
            >
              Real-time alerts, essential services, verified information and a strong community network — all in one platform for a safer and stronger Maharashtra.
            </motion.p>

            {/* Action Buttons with Pulse / Glow Physics */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.42 }}
              className="flex flex-wrap items-center gap-3.5 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.07, y: -3, boxShadow: '0 20px 30px -10px rgba(15, 44, 89, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAlertsClick}
                className="relative group bg-gradient-to-r from-[#0f2c59] to-[#091b38] text-white px-7 py-3.5 rounded-full font-black text-sm shadow-xl transition-all flex items-center gap-2.5 border border-blue-800/40 cursor-pointer overflow-hidden"
              >
                {/* Shimmer sweep effect */}
                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Bell className="w-4 h-4 text-yellow-300 animate-bounce" />
                <span>Get Real-Time Alerts</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.07, y: -3, boxShadow: '0 20px 30px -10px rgba(16, 185, 129, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCardClick('#services-section')}
                className="bg-white/90 hover:bg-white text-slate-900 border border-slate-300 px-7 py-3.5 rounded-full font-black text-sm shadow-lg transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-emerald-700 animate-pulse" />
                <span>Explore Services</span>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* ─── BOTTOM 6 FROSTED GLASS FEATURE CARDS (STAGGER + TILT ANIMATION) ─── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {bottomFeatureCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 45 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.08 * idx, ease: 'easeOut' }}
                  whileHover={{
                    y: -10,
                    scale: 1.05,
                    boxShadow: '0 25px 35px -10px rgba(16, 185, 129, 0.4)',
                    transition: { duration: 0.25 },
                  }}
                  whileTap={{ scale: 0.96 }}
                  key={card.id}
                  onClick={() => handleCardClick(card.path)}
                  className="relative group bg-emerald-950/50 hover:bg-emerald-950/80 border border-emerald-400/35 hover:border-emerald-300/80 backdrop-blur-md rounded-2xl p-3.5 transition-all text-white shadow-2xl cursor-pointer flex flex-col justify-between space-y-2 overflow-hidden"
                >
                  {/* Subtle Card Shimmer Background */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="space-y-1.5 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl ${card.iconColor} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-xs text-white group-hover:text-emerald-300 transition-colors leading-tight pt-1">
                      {card.title}
                    </h3>
                    <p className="text-[10px] text-emerald-100/80 leading-snug line-clamp-2 font-medium">
                      {card.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── DETAILED CIVIC SERVICES DIRECTORY (ANIMATED SCROLL REVEAL) ──────── */}
      <section id="services-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto space-y-3"
        >
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-4 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
            Maharashtra State Digital Infrastructure
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0f2c59]">
            Civic Services Directory
          </h2>
          <p className="text-slate-600 text-sm">
            Access instant digital tools engineered to assist local citizens, travelers, farmers, and emergency teams across all 36 districts of Maharashtra.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {civicServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.04 * index }}
                whileHover={{
                  y: -6,
                  scale: 1.025,
                  boxShadow: '0 20px 30px -10px rgba(15, 44, 89, 0.15)',
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.98 }}
                key={service.name}
                className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500/50 shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3"
                onClick={() => navigate(service.path)}
              >
                <div className="space-y-2.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${service.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{service.name}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{service.desc}</p>
                </div>
                <div className="pt-2 flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                  Open Module <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── ABOUT & FAQ SECTION (ANIMATED) ─────────────────────────────────── */}
      <section id="about-section" className="bg-slate-100/70 border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Announcements */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Megaphone className="text-emerald-700 w-5 h-5" />
                <h3 className="text-lg font-extrabold text-[#0f2c59]">Government & Municipal Updates</h3>
              </div>
              <div className="space-y-3 text-xs">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1 hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold uppercase">Statewide</span>
                  <p className="font-bold text-slate-900 text-sm">Mukhyamantri Majhi Ladki Bahin Yojana Direct DBT Distribution</p>
                  <p className="text-slate-600 text-xs">Monthly financial assistance verified and disbursed directly to eligible beneficiaries.</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-bold uppercase">MSRTC Transit</span>
                  <p className="font-bold text-slate-900 text-sm">Electric Shivai Bus Corridor Updates for Western Ghats</p>
                  <p className="text-slate-600 text-xs">Smart live telemetry active for Pune-Mumbai Expressway and Kolhapur routes.</p>
                </motion.div>
              </div>
            </motion.div>

            {/* FAQs */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <HelpCircle className="text-blue-700 w-5 h-5" />
                <h3 className="text-lg font-extrabold text-[#0f2c59]">Frequently Asked Questions</h3>
              </div>
              <div className="space-y-3 text-xs">
                <motion.div whileHover={{ x: 4 }} className="space-y-1 p-2.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
                  <p className="font-bold text-slate-900 text-sm">Does MahaResilience work in offline emergency scenarios?</p>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Yes. All vital emergency manuals, hospital lists, first-aid procedures, and offline maps are stored locally on your device via PWA and IndexedDB storage.
                  </p>
                </motion.div>
                <motion.div whileHover={{ x: 4 }} className="space-y-1 p-2.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
                  <p className="font-bold text-slate-900 text-sm">How does the Google Gemini AI Assistant work?</p>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    The embedded Gemini AI companion analyzes real-time municipal datasets, mandi rates, and local emergency alerts to provide dynamic, grounded advice.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0c2340] text-slate-300 py-10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">MR</div>
            <div>
              <p className="font-bold text-white text-sm">MahaResilience Platform</p>
              <p className="text-slate-400 text-[11px]">Government of Maharashtra Digital Innovation Initiative</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => navigate('/emergency')} className="hover:text-white transition-colors cursor-pointer">Emergency EOC</button>
            <button onClick={() => navigate('/admin')} className="hover:text-white transition-colors cursor-pointer">Admin Console</button>
            <button onClick={() => navigate('/community')} className="hover:text-white transition-colors cursor-pointer">Volunteer Network</button>
          </div>
        </div>
      </footer>

      {/* ─── EMBEDDED GOOGLE GEMINI AI ASSISTANT DRAWER ─────────────────────── */}
      <AIAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
