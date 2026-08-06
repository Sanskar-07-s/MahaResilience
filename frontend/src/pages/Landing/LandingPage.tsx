import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Users
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const services = [
    { name: 'Disaster SOS & Alerts', desc: 'Instant SOS trigger and active local zone alerts.', icon: Flame, color: 'text-danger bg-danger-light', path: '/emergency' },
    { name: 'Government Schemes', desc: 'Check eligibility for central & state schemes.', icon: Award, color: 'text-primary bg-primary-light', path: '/government' },
    { name: 'Grievance Reports', desc: 'File complaints for potholes, garbage & streetlights.', icon: FileSpreadsheet, color: 'text-secondary bg-secondary-light', path: '/complaints' },
    { name: 'Civic Map', desc: 'Interactive Leaflet mapping of public infrastructure.', icon: MapPin, color: 'text-yellow-600 bg-yellow-50', path: '/map' },
    { name: 'Emergency Health', desc: 'Find nearest primary health centers & bed counts.', icon: HeartPulse, color: 'text-teal-600 bg-teal-50', path: '/healthcare' },
    { name: 'Waste Scheduling', desc: 'Track garbage schedules & report litter zones.', icon: Trash2, color: 'text-orange-600 bg-orange-50', path: '/complaints' },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-md3 bg-gradient-to-r from-green-50 to-blue-50 border border-slate-border px-6 py-12 sm:px-12 sm:py-20 shadow-sm">
        <div className="relative z-10 max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Empowering Citizens of Maharashtra
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-bold text-slate-800 leading-tight"
          >
            Maharashtra's Unified <br />
            <span className="text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Smart Engagement Hub</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-600 leading-relaxed max-w-xl"
          >
            Access emergency services, verify government schemes eligibility, file infrastructure issues, view active localized alerts, and participate in community building—all in one secure, offline-first digital dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <button
              onClick={() => navigate('/emergency')}
              className="bg-danger text-white px-6 py-3 rounded-md3 font-bold hover:bg-danger-hover shadow-md hover-scale flex items-center gap-2"
            >
              <Flame className="w-5 h-5 animate-pulse" />
              Emergency SOS
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white text-slate-700 px-6 py-3 border border-slate-border rounded-md3 font-bold hover:bg-slate-50 shadow-sm flex items-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Ambient shapes */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-bl from-green-200/20 to-blue-200/20 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* Quick Statistics/Alert Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-danger rounded-md3">
            <Bell className="w-6 h-6 animate-swing" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Critical Alerts Active</p>
            <p className="text-xl font-bold text-slate-800">2 Warnings</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-primary rounded-md3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Community Safety Score</p>
            <p className="text-xl font-bold text-slate-800">89/100 (Safe)</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-secondary rounded-md3">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Active Volunteers</p>
            <p className="text-xl font-bold text-slate-800">4,821 Connected</p>
          </div>
        </div>
      </div>

      {/* Civic Services Directory */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-3xl font-bold text-slate-800">Civic Services Directory</h2>
          <p className="text-slate-500">Access instant digital tools engineered to assist local citizens, travelers, and emergency response teams.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <motion.div
              whileHover={{ y: -4 }}
              key={service.name}
              className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              onClick={() => navigate(service.path)}
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-md3 flex items-center justify-center ${service.color}`}>
                  <service.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">{service.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{service.desc}</p>
              </div>
              <div className="pt-4 flex items-center gap-1 text-sm font-semibold text-primary">
                Open service
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Maha Announcements & Quick Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 sm:p-8 rounded-md3 border border-slate-border shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Megaphone className="text-primary w-5 h-5" />
            <h3 className="text-xl font-bold text-slate-800">Local Authority Announcements</h3>
          </div>
          <div className="space-y-4 divide-y divide-slate-100">
            <div className="pt-2 first:pt-0 space-y-1">
              <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded font-semibold">BMC Announcement</span>
              <p className="font-semibold text-slate-800 hover:text-primary transition-colors cursor-pointer">Fogging and Mosquito Vector control schedules for K-East Ward</p>
              <p className="text-xs text-slate-400">Published July 29, 2026</p>
            </div>
            <div className="pt-4 space-y-1">
              <span className="text-xs bg-blue-100 text-secondary px-2 py-0.5 rounded font-semibold">Pune Metro</span>
              <p className="font-semibold text-slate-800 hover:text-primary transition-colors cursor-pointer">Extended operations hours for Pune Metro Line 2 for upcoming festivals</p>
              <p className="text-xs text-slate-400">Published July 28, 2026</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-md3 border border-slate-border shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-secondary w-5 h-5" />
            <h3 className="text-xl font-bold text-slate-800">Frequently Asked Questions</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">Does MahaResilience work without internet access?</p>
              <p className="text-sm text-slate-500">Yes! The platform is designed offline-first. Critical datasets like hospital directories, shelters, first-aid manuals, and public schemes are cached inside browser IndexedDB storage and remain fully usable offline.</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">How do I verify myself as a Volunteer?</p>
              <p className="text-sm text-slate-500">You can register as a Volunteer and upload identification credentials via the profile panel. Municipal supervisors review verification docs to verify citizen profiles.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
