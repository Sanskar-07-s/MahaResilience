import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Radio, Droplet, HeartPulse, Trash2, MapPin, FileSpreadsheet,
  ArrowRight, Shield, Activity, Users, Flame, Landmark, Sprout,
  GraduationCap, Bus, Compass, MessageSquare, CheckCircle, Bell, ChevronRight,
  Sparkles, Award, ExternalLink
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase.ts';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { useDisasterAlerts } from '../../contexts/AlertContext.tsx';
import { calculateLocationSafetyScore, SafetyScoreDetails } from '../../services/safetyScoreService.ts';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const locationCtx = useLocation();
  const { localAlerts } = useDisasterAlerts();

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
    { name: 'Disaster EOC & Alerts', desc: 'Real-time emergency warnings and evacuation guidance.', icon: Radio, path: '/emergency', gradient: 'from-red-500/20 via-orange-500/10 to-transparent text-red-400 border-red-500/30' },
    { name: 'Healthcare Services', desc: 'Find verified primary health centers & hospital beds.', icon: HeartPulse, path: '/healthcare', gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent text-emerald-400 border-emerald-500/30' },
    { name: 'Water & Tanker Booking', desc: 'Check water supply schedules & book municipal tankers.', icon: Droplet, path: '/water', gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent text-blue-400 border-blue-500/30' },
    { name: 'Electricity Outage Control', desc: 'MSEDCL power outage announcements & hazard reports.', icon: ShieldAlert, path: '/electricity', gradient: 'from-yellow-500/20 via-amber-500/10 to-transparent text-yellow-400 border-yellow-500/30' },
    { name: 'Sanitation & Waste Pickup', desc: 'Track garbage collection schedules & report littering.', icon: Trash2, path: '/waste', gradient: 'from-green-500/20 via-emerald-500/10 to-transparent text-green-400 border-green-500/30' },
    { name: 'APMC Agriculture Mandi', desc: 'Live crop mandi rates & expert agronomist advice.', icon: Sprout, path: '/agriculture', gradient: 'from-lime-500/20 via-green-500/10 to-transparent text-lime-400 border-lime-500/30' },
    { name: 'Government Welfare Schemes', desc: 'Verified eligibility checking for Maharashtra schemes.', icon: Landmark, path: '/government', gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent text-purple-400 border-purple-500/30' },
    { name: 'Educational Institutions', desc: 'Verified directory of schools, colleges & libraries.', icon: GraduationCap, path: '/education', gradient: 'from-indigo-500/20 via-blue-500/10 to-transparent text-indigo-400 border-indigo-500/30' },
    { name: 'Transit & Charging Nodes', desc: 'Public transit advisories & EV charging location map.', icon: Bus, path: '/transport', gradient: 'from-cyan-500/20 via-teal-500/10 to-transparent text-cyan-400 border-cyan-500/30' },
    { name: 'Tourism & Cultural Places', desc: 'Verified historic forts, temples & eco-tourism sites.', icon: Compass, path: '/tourism', gradient: 'from-teal-500/20 via-emerald-500/10 to-transparent text-teal-400 border-teal-500/30' },
    { name: 'Civic Grievance Reports', desc: 'File municipal complaints and track status in real-time.', icon: FileSpreadsheet, path: '/complaints', gradient: 'from-amber-500/20 via-orange-500/10 to-transparent text-amber-400 border-amber-500/30' },
    { name: 'Community Discussions', desc: 'Connect, share verified updates & support your community.', icon: MessageSquare, path: '/community', gradient: 'from-rose-500/20 via-pink-500/10 to-transparent text-rose-400 border-rose-500/30' },
  ];

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 space-y-16 pb-16">
      {/* CINEMATIC HERO SECTION */}
      <section className="relative min-h-[82vh] flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800/80 shadow-2xl bg-[#080d1a]">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-102 opacity-80"
          style={{ backgroundImage: `url('/hero_bg.png')` }}
        >
          {/* Subtle Ambient Radial Lighting Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-[#070b12]/65 to-[#070b12]/30" />
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Hero Main Content Box */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-10 sm:pt-16 pb-10 w-full space-y-6">
          {/* Location Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-black backdrop-blur-xl shadow-xl"
          >
            <MapPin className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>📍 Active Zone: <strong className="text-white">{districtName}, Maharashtra</strong></span>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-850 px-2 py-0.5 rounded border border-slate-700">Source: {locationSource}</span>
          </motion.div>

          <div className="max-w-3xl space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none drop-shadow-2xl"
            >
              Building a Resilient <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Maharashtra
              </span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight drop-shadow"
            >
              Together, We Recover. Together, We Rise.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium max-w-2xl drop-shadow"
            >
              Real-time alerts, essential services, verified information and a strong community network — all in one platform for a safer and stronger Maharashtra.
            </motion.p>
          </div>

          {/* Primary & Secondary CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <button
              onClick={() => navigate('/emergency')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2.5 hover-scale"
            >
              <Bell className="w-4 h-4 animate-bounce" />
              Get Real-Time Alerts
            </button>
            <a
              href="#services-section"
              className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-white font-black text-xs sm:text-sm border border-slate-700/80 backdrop-blur-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Explore Services
            </a>
          </motion.div>
        </div>

        {/* FEATURE CARDS GRID — MATCHING REFERENCE IMAGE 2 BOTTOM OVERLAY */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-8 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { title: 'Disaster Alerts', desc: 'Emergency notifications & verified info', icon: Radio, path: '/emergency', color: 'border-red-500/40 text-red-400' },
              { title: 'Essential Services', desc: 'Water, electricity, healthcare & waste', icon: Droplet, path: '#services-section', color: 'border-emerald-500/40 text-emerald-400' },
              { title: 'Civic Complaints', desc: 'Report civic issues & track resolution', icon: MessageSquare, path: '/complaints', color: 'border-amber-500/40 text-amber-400' },
              { title: 'Tourism & Places', desc: 'Discover verified places & heritage sites', icon: Compass, path: '/tourism', color: 'border-teal-500/40 text-teal-400' },
              { title: 'Community Hub', desc: 'Connect, share & support community', icon: Users, path: '/community', color: 'border-blue-500/40 text-blue-400' },
              { title: 'Safety & Preparedness', desc: 'Stay informed & prepare for emergency', icon: Shield, path: '/dashboard', color: 'border-indigo-500/40 text-indigo-400' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  key={card.title}
                  onClick={() => card.path.startsWith('/') ? navigate(card.path) : window.location.hash = card.path}
                  className="bg-slate-950/75 hover:bg-slate-900/95 backdrop-blur-xl border border-slate-800 hover:border-emerald-500/50 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-xl"
                >
                  <div className="space-y-2">
                    <div className={`p-2 w-8 h-8 rounded-xl bg-slate-900/90 border ${card.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors leading-tight">
                      {card.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">
                      {card.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LOCATION-AWARE ALERT PREVIEW SECTION */}
      <section className="py-10 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">GEOGRAPHICALLY SCOPED ALERT ENGINE</span>
            <h2 className="text-xl sm:text-2xl font-black text-white">Active Verified Bulletins for {districtName}</h2>
          </div>
          <button onClick={() => navigate('/emergency')} className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
            View All Advisories <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {localAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localAlerts.slice(0, 2).map((alert) => (
              <div
                key={alert.id || alert.title}
                className={`p-4 rounded-2xl border ${
                  alert.severity === 'CRITICAL' ? 'bg-red-950/40 border-red-500/50' : 'bg-slate-950 border-slate-800'
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
          <div className="p-6 bg-slate-950 border border-slate-800/80 rounded-2xl text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">No active emergency affecting your current location ({districtName}).</h3>
            <p className="text-xs text-slate-400">Local emergency operations center monitoring status: Normal.</p>
          </div>
        )}
      </section>

      {/* ESSENTIAL SERVICES DIRECTORY */}
      <section id="services-section" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">MAHARASHTRA CIVIC SERVICES</span>
          <h2 className="text-3xl font-black text-white">Essential Services Directory</h2>
          <p className="text-xs text-slate-400">Instant access to verified civic utilities, public healthcare, emergency dispatch and government services.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {servicesGrid.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                key={s.name}
                onClick={() => navigate(s.path)}
                className={`p-5 rounded-2xl bg-gradient-to-b ${s.gradient} border hover:border-emerald-400/50 transition-all cursor-pointer space-y-3 flex flex-col justify-between shadow-lg`}
              >
                <div className="space-y-3">
                  <div className="p-3 w-10 h-10 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-white">{s.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
                </div>
                <div className="pt-2 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  Access Service <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SAFETY & RESILIENCE SCORE SECTION */}
      <section className="py-10 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">REAL-TIME CIVIC SAFETY ANALYTICS</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Location Resilience Index</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Calculated dynamically using verified local hazard count, objective disaster metrics, and emergency response proximity for {districtName}.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex items-center gap-6 shadow-xl">
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

      {/* COMMUNITY & TOURISM PREVIEWS */}
      <section className="space-y-12">
        {/* Community Posts Stream */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">CITIZEN NETWORK</span>
              <h2 className="text-2xl font-black text-white">Recent Community Discussions</h2>
            </div>
            <button onClick={() => navigate('/community')} className="text-xs font-bold text-emerald-400 hover:underline">
              Join Community →
            </button>
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
            <button onClick={() => navigate('/tourism')} className="text-xs font-bold text-teal-400 hover:underline">
              Explore All Places →
            </button>
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

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800/80 pt-12 pb-6 text-xs text-slate-400 rounded-3xl p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="text-lg font-black text-white">MahaResilience</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Unified Disaster Management, Civic Infrastructure & Community Resilience Platform for Maharashtra.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-2">Essential Utilities</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => navigate('/emergency')} className="hover:text-emerald-400">Disaster EOC</button></li>
              <li><button onClick={() => navigate('/healthcare')} className="hover:text-emerald-400">Healthcare Facilities</button></li>
              <li><button onClick={() => navigate('/water')} className="hover:text-emerald-400">Water Tanker Supply</button></li>
              <li><button onClick={() => navigate('/electricity')} className="hover:text-emerald-400">Electricity Outages</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-2">Public Services</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => navigate('/government')} className="hover:text-emerald-400">Government Schemes</button></li>
              <li><button onClick={() => navigate('/complaints')} className="hover:text-emerald-400">Civic Complaints</button></li>
              <li><button onClick={() => navigate('/tourism')} className="hover:text-emerald-400">Tourism & Places</button></li>
              <li><button onClick={() => navigate('/community')} className="hover:text-emerald-400">Community Network</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-2">Official Resources</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Disaster alerts cross-referenced with Maharashtra State Disaster Management Authority (MSDMA) & SACHET NDMA portal datasets.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-8 pt-6 flex justify-between items-center text-[10px]">
          <div>© {new Date().getFullYear()} MahaResilience. All Rights Reserved.</div>
          <div>Built for a Safer & Stronger Maharashtra</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
