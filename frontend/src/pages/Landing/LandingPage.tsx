import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { AIAssistantDrawer } from '../../components/ai/AIAssistantDrawer.tsx';

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
      desc: 'Instant notifications and real-time updates',
      path: '/alerts',
      glow: 'group-hover:border-red-400/70',
      badge: 'Live EOC',
    },
    {
      id: 'services',
      icon: Droplets,
      title: 'Essential Services',
      desc: 'Water, Electricity, Waste, Healthcare and more',
      path: '#services-section',
      glow: 'group-hover:border-blue-400/70',
      badge: 'Utilities',
    },
    {
      id: 'complaints',
      icon: MessageSquare,
      title: 'Civic Complaints',
      desc: 'Report issues and track resolution in real-time',
      path: '/complaints',
      glow: 'group-hover:border-amber-400/70',
      badge: 'Grievance',
    },
    {
      id: 'tourism',
      icon: Camera,
      title: 'Tourism & Places',
      desc: 'Explore verified places and local attractions',
      path: '/tourism',
      glow: 'group-hover:border-teal-400/70',
      badge: 'Heritage',
    },
    {
      id: 'community',
      icon: Users,
      title: 'Community Hub',
      desc: 'Connect, share and support your community',
      path: '/community',
      glow: 'group-hover:border-rose-400/70',
      badge: 'Social',
    },
    {
      id: 'safety',
      icon: ShieldCheck,
      title: 'Safety & Preparedness',
      desc: 'Stay informed and be prepared for any situation',
      path: '/emergency',
      glow: 'group-hover:border-emerald-400/70',
      badge: 'Rescue',
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* ─── FULLSCREEN HERO CONTAINER WITH BACKGROUND ────────────────────── */}
      <div
        className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/hero_bg.png')` }}
      >
        {/* Ambient Lighting Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/65 pointer-events-none" />

        {/* ─── TOP GLASS FLOATING NAVBAR (ANIMATED) ─────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between"
        >
          {/* Brand Logo & Tagline */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            {/* 4-Quadrant Shield Emblem with soft glow */}
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="w-11 h-11 rounded-xl bg-white/95 border border-emerald-600/30 p-1.5 shadow-md flex flex-wrap items-center justify-center gap-0.5 shrink-0 backdrop-blur-md group-hover:shadow-emerald-500/20"
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

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 bg-white/50 hover:bg-white/70 backdrop-blur-md px-6 py-2 rounded-full border border-white/70 shadow-xs text-sm font-semibold text-slate-800 transition-all">
            {[
              { name: 'Home', action: () => navigate('/') },
              { name: 'Services', action: () => handleCardClick('#services-section') },
              { name: 'Alerts', action: () => handleAlertsClick() },
              { name: 'Resources', action: () => navigate('/government') },
              { name: 'Dashboard', action: () => handleCardClick('/dashboard') },
              { name: 'About Us', action: () => handleCardClick('#about-section') },
            ].map((item) => (
              <button
                key={item.name}
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
              </button>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAiDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/85 hover:bg-white text-emerald-900 rounded-full text-xs font-extrabold border border-emerald-600/30 shadow-xs backdrop-blur-md transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>Gemini AI</span>
            </motion.button>

            {user ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-[#0f2c59] hover:bg-[#0c2340] text-white rounded-full text-xs font-bold shadow-md transition-all"
              >
                My Account
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-[#0f2c59] hover:bg-[#0c2340] text-white rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </motion.button>
            )}
          </div>
        </motion.header>

        {/* ─── HERO MAIN CONTENT (ANIMATED) ─────────────────────────────────── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="max-w-2xl space-y-4">
            <motion.h1
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0c2340] tracking-tight leading-[1.1] drop-shadow-xs"
            >
              Building a <br />
              Resilient Maharashtra
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#157948] tracking-tight leading-snug drop-shadow-xs"
            >
              Together, We Recover. <br />
              Together, We Rise.
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28 }}
              className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed max-w-xl pt-2"
            >
              Real-time alerts, essential services, verified information and a strong community network — all in one platform for a safer and stronger Maharashtra.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.38 }}
              className="flex flex-wrap items-center gap-3.5 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleAlertsClick}
                className="bg-[#0f2c59] hover:bg-[#091b38] text-white px-6 py-3.5 rounded-full font-extrabold text-sm shadow-xl transition-all flex items-center gap-2 border border-blue-900/40 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-yellow-300 animate-bounce" />
                Get Real-Time Alerts
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCardClick('#services-section')}
                className="bg-white/90 hover:bg-white text-slate-900 border border-slate-300 px-6 py-3.5 rounded-full font-extrabold text-sm shadow-lg transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-emerald-700" />
                Explore Services
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* ─── BOTTOM 6 FROSTED GLASS FEATURE CARDS (ANIMATED STAGGER) ────────── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {bottomFeatureCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.1 * idx, ease: 'easeOut' }}
                  whileHover={{
                    y: -8,
                    scale: 1.04,
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.96 }}
                  key={card.id}
                  onClick={() => handleCardClick(card.path)}
                  className={`bg-emerald-950/45 hover:bg-emerald-950/75 border border-emerald-400/35 ${card.glow} backdrop-blur-md rounded-2xl p-3.5 transition-all text-white shadow-2xl cursor-pointer flex flex-col justify-between space-y-2 group`}
                >
                  <div className="space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/25 border border-emerald-300/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 group-hover:bg-emerald-500/40 transition-all">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-xs text-white group-hover:text-emerald-300 transition-colors leading-tight">
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
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto space-y-2.5"
        >
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-200">
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: 0.04 * index }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={service.name}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-3"
                onClick={() => navigate(service.path)}
              >
                <div className="space-y-2.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${service.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{service.name}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{service.desc}</p>
                </div>
                <div className="pt-2 flex items-center gap-1 text-xs font-bold text-emerald-700">
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
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Megaphone className="text-emerald-700 w-5 h-5" />
                <h3 className="text-lg font-extrabold text-[#0f2c59]">Government & Municipal Updates</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1 hover:bg-emerald-50 transition-colors">
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold uppercase">Statewide</span>
                  <p className="font-bold text-slate-900 text-sm">Mukhyamantri Majhi Ladki Bahin Yojana Direct DBT Distribution</p>
                  <p className="text-slate-600 text-xs">Monthly financial assistance verified and disbursed directly to eligible beneficiaries.</p>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1 hover:bg-blue-50 transition-colors">
                  <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-bold uppercase">MSRTC Transit</span>
                  <p className="font-bold text-slate-900 text-sm">Electric Shivai Bus Corridor Updates for Western Ghats</p>
                  <p className="text-slate-600 text-xs">Smart live telemetry active for Pune-Mumbai Expressway and Kolhapur routes.</p>
                </div>
              </div>
            </motion.div>

            {/* FAQs */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <HelpCircle className="text-blue-700 w-5 h-5" />
                <h3 className="text-lg font-extrabold text-[#0f2c59]">Frequently Asked Questions</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="space-y-1 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <p className="font-bold text-slate-900 text-sm">Does MahaResilience work in offline emergency scenarios?</p>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Yes. All vital emergency manuals, hospital lists, first-aid procedures, and offline maps are stored locally on your device via PWA and IndexedDB storage.
                  </p>
                </div>
                <div className="space-y-1 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <p className="font-bold text-slate-900 text-sm">How does the Google Gemini AI Assistant work?</p>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    The embedded Gemini AI companion analyzes real-time municipal datasets, mandi rates, and local emergency alerts to provide dynamic, grounded advice.
                  </p>
                </div>
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
            <button onClick={() => navigate('/emergency')} className="hover:text-white transition-colors">Emergency EOC</button>
            <button onClick={() => navigate('/admin')} className="hover:text-white transition-colors">Admin Console</button>
            <button onClick={() => navigate('/community')} className="hover:text-white transition-colors">Volunteer Network</button>
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
