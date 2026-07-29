import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
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
  HelpCircle
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [safetyScore, setSafetyScore] = useState<number | null>(null);
  const [safetyMetrics, setSafetyMetrics] = useState<any>(null);
  const [loadingScore, setLoadingScore] = useState(true);

  useEffect(() => {
    const fetchSafetyData = async () => {
      try {
        const response = await fetch('/api/complaints/safety-score?lat=18.922&lng=72.834'); // Mumbai coordinates
        const data = await response.json();
        if (response.ok) {
          setSafetyScore(data.safetyScore);
          setSafetyMetrics(data.metrics);
        }
      } catch (err) {
        console.error('Failed to load safety score', err);
      } finally {
        setLoadingScore(false);
      }
    };
    fetchSafetyData();
  }, []);

  const stats = [
    { title: 'My Open Complaints', value: '1 Active', desc: 'Broken Streetlight #SL-903', icon: FileSpreadsheet, color: 'text-secondary bg-secondary-light' },
    { title: 'Registered Events', value: '2 Upcoming', desc: 'Tree plantation & Blood camp', icon: Users, color: 'text-primary bg-primary-light' },
    { title: 'Applied Schemes', value: '3 Approved', desc: 'PM-Kisan & Sanjay Gandhi', icon: Award, color: 'text-yellow-600 bg-yellow-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white p-6 sm:p-8 rounded-md3 border border-slate-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Jai Maharashtra, <span className="text-primary">{user?.name}</span>!
          </h1>
          <p className="text-slate-500 text-sm mt-1">Here is your local community overview for Mumbai-South.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/emergency')}
            className="bg-danger text-white px-4 py-2 rounded-md3 text-sm font-bold hover:bg-danger-hover shadow-sm flex items-center gap-1.5"
          >
            <Flame className="w-4 h-4 animate-bounce" />
            SOS Beacon
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
            ) : (
              <div className="relative flex items-center justify-center">
                {/* Score Circle */}
                <div className="w-28 h-28 rounded-full border-8 border-green-100 flex items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-800">{safetyScore || 90}</span>
                </div>
                <div className="absolute -bottom-2 bg-primary text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                  SAFE ZONE
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Streetlight Functionality:</span>
              <span className="font-semibold text-slate-700">{(safetyMetrics?.streetlightRatio * 100).toFixed(0) || '92'}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Civic Grievance Resolution:</span>
              <span className="font-semibold text-slate-700">{(safetyMetrics?.complaintResolutionRate * 100).toFixed(0) || '85'}%</span>
            </div>
          </div>
        </div>

        {/* Stats Summary cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm flex flex-col justify-between h-full">
              <div className={`w-10 h-10 rounded-md3 flex items-center justify-center ${stat.color} mb-4`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{stat.title}</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">{stat.desc}</p>
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
