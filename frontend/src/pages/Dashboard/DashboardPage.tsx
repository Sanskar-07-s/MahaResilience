import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { getApiUrl } from '../../config/api.config.ts';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Flame,
  FileSpreadsheet,
  Award,
  Users,
  Compass,
  CheckCircle,
  HelpCircle,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ChevronRight,
  Activity
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase.ts';

import { calculateLocationSafetyScore, SafetyScoreDetails } from '../../services/safetyScoreService.ts';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { latitude, longitude, ward, city, district, state, source, detectLocation, locationLoading } = useLocation();
  const navigate = useNavigate();
  const [safetyDetails, setSafetyDetails] = useState<SafetyScoreDetails | null>(null);
  const [loadingScore, setLoadingScore] = useState(true);

  // Real-time live stats state
  const [complaintsData, setComplaintsData] = useState<{
    openCount: number;
    totalCount: number;
    latestTitle: string | null;
    latestStatus: string | null;
    latestWard: string | null;
  }>({
    openCount: 0,
    totalCount: 0,
    latestTitle: null,
    latestStatus: null,
    latestWard: null,
  });

  const [eventsData, setEventsData] = useState<{
    userActiveCount: number;
    districtUpcomingCount: number;
    latestTitle: string | null;
    latestLocation: string | null;
  }>({
    userActiveCount: 0,
    districtUpcomingCount: 0,
    latestTitle: null,
    latestLocation: null,
  });

  const [schemesData, setSchemesData] = useState<{
    approvedCount: number;
    pendingCount: number;
    totalCount: number;
    latestSchemeName: string | null;
  }>({
    approvedCount: 0,
    pendingCount: 0,
    totalCount: 0,
    latestSchemeName: null,
  });

  useEffect(() => {
    const fetchSafetyData = async () => {
      setLoadingScore(true);
      const lat = latitude || 18.5204;
      const lng = longitude || 73.8567;
      const details = await calculateLocationSafetyScore(lat, lng, district, city, ward);
      setSafetyDetails(details);
      setLoadingScore(false);
    };
    fetchSafetyData();
  }, [latitude, longitude, district, city, ward]);

  // Real-time listeners for user activity across platform
  useEffect(() => {
    // 1. Complaints Live Listener (Filtered for current user)
    const unsubComplaints = onSnapshot(
      collection(db, 'complaints'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const isUserComplaint =
            user &&
            (data.citizenId === user.uid ||
              data.citizenId === user.id ||
              data.userId === user.uid ||
              (user.name && data.citizenName && data.citizenName.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
              (user.email && data.citizenEmail && data.citizenEmail.toLowerCase() === user.email.toLowerCase()) ||
              (user.phone && data.citizenPhone && data.citizenPhone === user.phone));

          if (isUserComplaint) {
            list.push({ id: d.id, ...data });
          }
        });

        list.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });

        const openList = list.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED');
        setComplaintsData({
          openCount: openList.length,
          totalCount: list.length,
          latestTitle: openList[0]?.title || list[0]?.title || null,
          latestStatus: openList[0]?.status || list[0]?.status || null,
          latestWard: openList[0]?.ward || list[0]?.ward || null,
        });
      },
      (err) => console.warn('Dashboard complaints live sync note:', err.message)
    );

    // 2. Events & Civic Facility Requests Live Listener
    const unsubFacility = onSnapshot(
      collection(db, 'facilityRequests'),
      (snapshot) => {
        const userReqs: any[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const isUserReq =
            user &&
            (data.userId === user.uid ||
              (user.name && data.citizenName && data.citizenName.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
              (user.phone && data.phone && data.phone === user.phone));

          if (isUserReq) {
            userReqs.push({ id: d.id, ...data });
          }
        });

        userReqs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        const activeReqs = userReqs.filter((r) => r.status !== 'RESOLVED' && r.status !== 'COMPLETED' && r.status !== 'REJECTED');

        setEventsData((prev) => ({
          ...prev,
          userActiveCount: activeReqs.length,
          latestTitle: activeReqs[0]?.facilityType || prev.latestTitle,
          latestLocation: activeReqs[0]?.wardOrLocation || prev.latestLocation,
        }));
      },
      (err) => console.warn('Dashboard facility requests note:', err.message)
    );

    // Community Events Live Listener
    const unsubPosts = onSnapshot(
      collection(db, 'communityPosts'),
      (snapshot) => {
        const eventPosts: any[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.category === 'EVENT') {
            eventPosts.push({ id: d.id, ...data });
          }
        });

        eventPosts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        setEventsData((prev) => ({
          ...prev,
          districtUpcomingCount: eventPosts.length,
          latestTitle: prev.userActiveCount > 0 ? prev.latestTitle : eventPosts[0]?.title || prev.latestTitle,
          latestLocation: prev.userActiveCount > 0 ? prev.latestLocation : eventPosts[0]?.district || prev.latestLocation,
        }));
      },
      (err) => console.warn('Dashboard community posts note:', err.message)
    );

    // 3. Government Scheme Applications & Proposals Live Listener
    const unsubSchemes = onSnapshot(
      collection(db, 'schemeApplications'),
      (snapshot) => {
        const userApps: any[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const isUserApp =
            user &&
            (data.userId === user.uid ||
              (user.name && data.applicantName && data.applicantName.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
              (user.phone && (data.applicantPhone === user.phone || data.phone === user.phone)));

          if (isUserApp) {
            userApps.push({ id: d.id, ...data });
          }
        });

        const approved = userApps.filter((a) => a.status === 'APPROVED');
        const pending = userApps.filter((a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW');

        userApps.sort((a, b) => new Date(b.appliedDate || b.createdAt || 0).getTime() - new Date(a.appliedDate || a.createdAt || 0).getTime());

        setSchemesData({
          approvedCount: approved.length,
          pendingCount: pending.length,
          totalCount: userApps.length,
          latestSchemeName: userApps[0]?.schemeName || null,
        });
      },
      (err) => console.warn('Dashboard schemeApplications note:', err.message)
    );

    return () => {
      unsubComplaints();
      unsubFacility();
      unsubPosts();
      unsubSchemes();
    };
  }, [user]);

  // Compute live user stats
  const stats = [
    {
      title: 'My Open Complaints',
      value:
        complaintsData.openCount > 0
          ? `${complaintsData.openCount} Active`
          : complaintsData.totalCount > 0
          ? `0 Active (${complaintsData.totalCount} Resolved)`
          : '0 Active',
      desc: complaintsData.latestTitle
        ? `Latest: ${complaintsData.latestTitle.length > 28 ? complaintsData.latestTitle.slice(0, 28) + '...' : complaintsData.latestTitle} (${complaintsData.latestStatus || 'Active'})`
        : `No pending complaints in ${district || 'your ward'}`,
      icon: FileSpreadsheet,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      actionUrl: '/complaints',
      badge: complaintsData.openCount > 0 ? 'Live Grievance' : 'Up to date',
    },
    {
      title: 'Registered Events',
      value:
        eventsData.userActiveCount > 0
          ? `${eventsData.userActiveCount} Active`
          : eventsData.districtUpcomingCount > 0
          ? `${eventsData.districtUpcomingCount} Upcoming`
          : '0 Upcoming',
      desc: eventsData.latestTitle
        ? `${eventsData.latestTitle.length > 30 ? eventsData.latestTitle.slice(0, 30) + '...' : eventsData.latestTitle} in ${ward || city || district}`
        : `Community drives in ${ward || city || district}`,
      icon: Users,
      color: 'text-primary bg-primary-light border-primary/20',
      actionUrl: '/community',
      badge: eventsData.userActiveCount > 0 ? 'Your Ticket' : 'Community',
    },
    {
      title: 'Applied Schemes',
      value:
        schemesData.approvedCount > 0
          ? `${schemesData.approvedCount} Approved${schemesData.pendingCount > 0 ? ` (${schemesData.pendingCount} In Review)` : ''}`
          : schemesData.pendingCount > 0
          ? `${schemesData.pendingCount} In Review`
          : schemesData.totalCount > 0
          ? `${schemesData.totalCount} Applied`
          : '0 Applied',
      desc: schemesData.latestSchemeName
        ? `Latest: ${schemesData.latestSchemeName.length > 32 ? schemesData.latestSchemeName.slice(0, 32) + '...' : schemesData.latestSchemeName}`
        : `18 active ${state} Govt & PM Schemes available`,
      icon: Award,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      actionUrl: '/government',
      badge: schemesData.approvedCount > 0 ? 'DBT Verified' : schemesData.totalCount > 0 ? 'In Review' : 'Check Eligibility',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white p-6 sm:p-8 rounded-md3 border border-slate-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>📍 Active Locality: {ward || city}, {district} ({source.toUpperCase()})</span>
            <button
              onClick={() => detectLocation()}
              disabled={locationLoading}
              className="ml-1 hover:rotate-180 transition-transform text-slate-500"
              title="Re-detect GPS location"
            >
              <RefreshCw className={`w-3 h-3 ${locationLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Jai Maharashtra, <span className="text-primary">{user?.name}</span>!
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Personalized community overview & localized services for <strong className="text-slate-700">{ward || city}, {district}</strong>.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/emergency')}
            className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-red-700 shadow-md flex items-center gap-2 animate-pulse transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>🚨 Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Safety Score & Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Safety Score Card */}
        <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
              <ShieldCheck className="text-primary w-5 h-5" />
              Community Safety Score
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Calculated in real-time from civic reports & hazard levels</p>
          </div>

          <div className="flex flex-col items-center py-4">
            {loadingScore ? (
              <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
            ) : safetyDetails?.score === null ? (
              <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
                Safety score unavailable due to insufficient verified data.
              </div>
            ) : (
              <div className="relative flex items-center justify-center">
                {/* Score Circle */}
                <div className="w-28 h-28 rounded-full border-8 border-teal-100 flex items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-800">
                    {safetyDetails?.score}
                  </span>
                </div>
                <div className="absolute -bottom-2 bg-teal-700 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  {safetyDetails?.zoneLabel}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Objective Risk Weight (70%):</span>
              <span className="font-bold text-slate-700">
                {safetyDetails?.metrics?.objectiveDisasterScore || 85}/100
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Community Feedback (20%):</span>
              <span className="font-bold text-slate-700">
                {safetyDetails?.metrics?.communityValidatedScore || 90}/100
              </span>
            </div>
          </div>
        </div>

        {/* Stats Summary cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              onClick={() => navigate(stat.actionUrl)}
              className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm flex flex-col justify-between h-full hover:border-primary/50 hover:shadow-md cursor-pointer transition-all duration-200 group relative overflow-hidden"
              title={`Click to open ${stat.title}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-md3 flex items-center justify-center ${stat.color} border shadow-xs transition-transform group-hover:scale-105`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {stat.badge}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{stat.title}</p>
                <p className="text-xl font-black text-slate-800 mt-1 group-hover:text-primary transition-colors">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2 line-clamp-2">{stat.desc}</p>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-primary transition-colors pt-2 border-t border-slate-50">
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}

          {/* Quick Actions Grid */}
          <div className="sm:col-span-3 bg-white p-6 rounded-md3 border border-slate-border shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Quick Quick-Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/complaints')}
                className="py-3 px-4 bg-slate-50 hover:bg-primary-light hover:text-primary border border-slate-border rounded-md3 text-sm font-medium text-slate-700 transition-colors"
              >
                Report Pothole / Trash
              </button>
              <button
                onClick={() => navigate('/government')}
                className="py-3 px-4 bg-slate-50 hover:bg-primary-light hover:text-primary border border-slate-border rounded-md3 text-sm font-medium text-slate-700 transition-colors"
              >
                Eligibility Checker
              </button>
              <button
                onClick={() => navigate('/map')}
                className="py-3 px-4 bg-slate-50 hover:bg-primary-light hover:text-primary border border-slate-border rounded-md3 text-sm font-medium text-slate-700 transition-colors"
              >
                Locate Nearby PHC
              </button>
              <button
                onClick={() => navigate('/alerts')}
                className="py-3 px-4 bg-slate-50 hover:bg-primary-light hover:text-primary border border-slate-border rounded-md3 text-sm font-medium text-slate-700 transition-colors"
              >
                AQI & Local Weather
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
