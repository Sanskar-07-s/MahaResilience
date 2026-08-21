import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Flame,
  Award,
  Bell,
  HeartPulse,
  Trash2,
  MapPin,
  HelpCircle,
  FileSpreadsheet,
  Megaphone,
  ArrowRight,
  TrendingUp,
  Activity,
  Users,
  Sprout,
  GraduationCap,
  Bus,
  Compass,
  Radio,
  Droplet,
  Zap,
  Landmark,
  MessageSquare,
  Bot,
  Sparkles,
  ShieldCheck,
  LogIn
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { AIAssistantDrawer } from '../../components/ai/AIAssistantDrawer.tsx';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { ward, city, district } = useLocation();
  const { user } = useAuth();
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const services = [
    { name: 'Disaster SOS & Alerts', desc: 'Instant SOS trigger and active local zone disaster alerts.', icon: Flame, color: 'text-red-600 bg-red-50 border-red-100', path: '/emergency' },
    { name: 'Government Welfare Schemes', desc: 'Check eligibility for Ladki Bahin, PM-Kisan & State DBT schemes.', icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-100', path: '/government' },
    { name: 'Civic Grievance Reports', desc: 'File municipal complaints for potholes, garbage & streetlights.', icon: FileSpreadsheet, color: 'text-amber-600 bg-amber-50 border-amber-100', path: '/complaints' },
    { name: 'Emergency Healthcare & Beds', desc: 'Find nearest 24x7 civil hospitals, ICU availability & blood banks.', icon: HeartPulse, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', path: '/healthcare' },
    { name: 'Municipal Water & Tankers', desc: 'Track dam water storage levels & book municipal drinking tankers.', icon: Droplet, color: 'text-blue-600 bg-blue-50 border-blue-100', path: '/water' },
    { name: 'MSEDCL Electricity Grid', desc: 'Monitor power outage schedules, feeder trippings & line hazards.', icon: Zap, color: 'text-yellow-600 bg-yellow-50 border-yellow-100', path: '/electricity' },
    { name: 'Sanitation & Solid Waste', desc: 'Track garbage compactor schedules & report dumping blackspots.', icon: Trash2, color: 'text-teal-600 bg-teal-50 border-teal-100', path: '/waste' },
    { name: 'APMC Agriculture Mandi', desc: 'Daily market commodity prices & expert agronomist pest guidance.', icon: Sprout, color: 'text-green-600 bg-green-50 border-green-100', path: '/agriculture' },
    { name: 'Educational Institutions', desc: 'Discover government colleges, public libraries & vocational ITIs.', icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', path: '/education' },
    { name: 'Transit & EV Fast Chargers', desc: 'Real-time MSRTC bus status, ghat advisories & EV fast chargers.', icon: Bus, color: 'text-cyan-600 bg-cyan-50 border-cyan-100', path: '/transport' },
    { name: 'Tourism & Cultural Places', desc: 'Verified historic forts, ancient temples & scenic eco-spots.', icon: Compass, color: 'text-teal-600 bg-teal-50 border-teal-100', path: '/tourism' },
    { name: 'Community Discussions', desc: 'Connect with local citizens, share updates & assist your neighborhood.', icon: MessageSquare, color: 'text-rose-600 bg-rose-50 border-rose-100', path: '/community' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      {/* Standalone Landing Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-700 to-sky-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
            MR
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-lg tracking-tight leading-none flex items-center gap-1.5">
              MahaResilience
              <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                Maharashtra Gov Hub
              </span>
            </h1>
            <span className="text-[11px] text-slate-500 font-medium">
              Citizen Safety, Governance & Smart Resilience
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsAiDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold border border-teal-200 transition-all shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
            <span className="hidden sm:inline">Ask</span> Gemini AI
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            Admin Portal
          </button>

          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-600" /> Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-slate-200 px-6 py-12 sm:px-12 sm:py-16 shadow-xs">
          <div className="relative z-10 max-w-3xl space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-teal-700" />
              Empowering Citizens of Maharashtra • {ward || city || 'Statewide'}, {district || 'Maharashtra'}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight"
            >
              Maharashtra's Unified <br />
              <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-sky-600 bg-clip-text text-transparent">
                Smart Resilience & Engagement Hub
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal"
            >
              Access emergency services, verify government schemes eligibility, file infrastructure issues, view active localized alerts, and participate in community building—all in one secure, offline-first digital dashboard.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3 pt-2"
            >
              <button
                onClick={() => navigate('/emergency')}
                className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-700 shadow-md transition-all flex items-center gap-2 text-sm"
              >
                <Flame className="w-4 h-4 animate-pulse" />
                Emergency SOS
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-white text-slate-700 px-6 py-3 border border-slate-300 rounded-2xl font-bold hover:bg-slate-50 shadow-xs transition-all flex items-center gap-2 text-sm"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>

          {/* Ambient background decoration */}
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-bl from-teal-200/30 to-sky-200/30 rounded-full blur-3xl -z-10" />
        </div>

        {/* Quick Statistics/Alert Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Critical Alerts Active</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">2 Live Advisories</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Regional Safety Score</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">92 / 100 (Safe)</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Volunteers</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">4,820 Verified</p>
            </div>
          </div>
        </div>

        {/* Civic Services Directory */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              Unified Public Services
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Civic Services Directory</h2>
            <p className="text-slate-500 text-sm">
              Access instant digital tools engineered to assist local citizens, travelers, farmers, and emergency teams.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <motion.div
                  whileHover={{ y: -3 }}
                  key={service.name}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
                  onClick={() => navigate(service.path)}
                >
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${service.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{service.name}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{service.desc}</p>
                  </div>
                  <div className="pt-2 flex items-center gap-1 text-xs font-bold text-teal-700">
                    Open Service <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Maha Announcements & FAQs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Megaphone className="text-teal-700 w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-900">Local Authority Announcements</h3>
            </div>
            <div className="space-y-4 divide-y divide-slate-100 text-xs">
              <div className="pt-2 first:pt-0 space-y-1">
                <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold uppercase">Municipal Notice</span>
                <p className="font-bold text-slate-800 text-sm">Monsoon Drainage Clearing & Vector Control Drive</p>
                <p className="text-slate-500 text-xs">Sanitation squads deployed across all wards to clear storm water drains.</p>
              </div>
              <div className="pt-3 space-y-1">
                <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold uppercase">Transit Update</span>
                <p className="font-bold text-slate-800 text-sm">MSRTC Special E-Shivai Bus Services for Festivals</p>
                <p className="text-slate-500 text-xs">Additional electric shuttle services operating on major highway corridors.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <HelpCircle className="text-sky-700 w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h3>
            </div>
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-sm">Does MahaResilience work without internet access?</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Yes! The platform is designed offline-first. Critical datasets like hospital directories, shelters, first-aid manuals, and public schemes are cached in browser IndexedDB storage and remain usable offline.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-sm">How do I verify myself as a Volunteer or Admin?</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  You can register and choose your account role or request elevation from the Super Administrator portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Embedded Google Gemini AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
