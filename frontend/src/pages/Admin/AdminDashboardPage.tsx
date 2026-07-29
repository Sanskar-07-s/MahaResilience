import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import {
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  UserCheck,
  Megaphone,
  CheckCircle,
  Clock,
  Briefcase
} from 'lucide-react';

interface Complaint {
  id: string;
  title: string;
  category: string;
  status: string;
  address: string;
  upvotes: number;
  priority: string;
  citizen: { name: string };
}

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Alert publishing state
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDesc, setAlertDesc] = useState('');
  const [alertType, setAlertType] = useState('WEATHER');
  const [alertSeverity, setAlertSeverity] = useState('WARNING');
  const [alertRadius, setAlertRadius] = useState(5000);
  const [alertSuccess, setAlertSuccess] = useState(false);

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/complaints');
      if (response.ok) {
        setComplaints(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      const response = await fetch(`/api/complaints/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ch_token') || ''}`,
        },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      if (response.ok) {
        fetchComplaints();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertSuccess(false);

    try {
      const response = await fetch('/api/emergency/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ch_token') || ''}`,
        },
        body: JSON.stringify({
          title: alertTitle,
          description: alertDesc,
          type: alertType,
          severity: alertSeverity,
          latitude: 18.5204, // Default center
          longitude: 73.8567,
          radius: alertRadius,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Active for 24h
        }),
      });

      if (response.ok) {
        setAlertSuccess(true);
        setAlertTitle('');
        setAlertDesc('');
        setTimeout(() => setAlertSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Municipal & Official Control Center</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review reported grievances, route resources, publish emergency alerts, and verify community volunteer assets.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Unresolved Complaints', value: complaints.filter(c => c.status !== 'RESOLVED').length, desc: 'Potholes, leakage, waste', icon: FileSpreadsheet, color: 'bg-red-50 text-danger border-red-200' },
          { label: 'Active SOS Signals', value: 0, desc: 'Critical beacons in 24h', icon: AlertTriangle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: 'Volunteers Enrolled', value: 124, desc: 'Verified rescue assets', icon: Briefcase, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Platform Rating Avg', value: '4.8/5', desc: 'Citizen feedback satisfaction', icon: UserCheck, color: 'bg-green-50 text-green-700 border-green-200' },
        ].map((stat, idx) => (
          <div key={idx} className={`p-6 rounded-md3 border bg-white shadow-sm flex items-center gap-4`}>
            <div className={`p-3 rounded-md3 ${stat.color.split(' ')[0]} ${stat.color.split(' ')[1]}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">{stat.label}</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{stat.value}</p>
              <p className="text-[10px] text-slate-400 mt-1">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Grievance dispatcher */}
        <div className="lg:col-span-2 bg-white p-6 rounded-md3 border border-slate-border shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" /> Active Complaints Inbox
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : complaints.filter(c => c.status !== 'RESOLVED').length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Inbox clean! All reported citizen issues resolved.</p>
          ) : (
            <div className="space-y-4">
              {complaints
                .filter(c => c.status !== 'RESOLVED')
                .map((complaint) => (
                  <div key={complaint.id} className="p-4 rounded-md3 border border-slate-border flex justify-between items-center gap-4 bg-slate-50/50">
                    <div>
                      <span className="text-[10px] bg-red-100 text-danger px-2 py-0.5 rounded font-bold uppercase">
                        {complaint.priority}
                      </span>
                      <h4 className="font-bold text-slate-800 mt-1">{complaint.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Location: {complaint.address}</p>
                      <p className="text-xs text-slate-400 mt-1">Reported by: {complaint.citizen?.name || 'Citizen'}</p>
                    </div>
                    <button
                      onClick={() => handleResolve(complaint.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-1.5 rounded-md3 text-xs font-bold shadow-sm transition-all"
                    >
                      Mark Resolved
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right Side: Emergency broadcaster form */}
        <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm h-fit space-y-6">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-danger" /> Broadcast Emergency Warning
          </h3>

          {alertSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md3 text-xs font-semibold">
              ✓ Emergency Alert published and routed to regional users successfully.
            </div>
          )}

          <form onSubmit={handlePublishAlert} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Alert Title</label>
              <input
                type="text"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                className="w-full px-4.5 py-2 rounded-md3 border border-slate-border outline-none focus:ring-2 focus:ring-danger/20"
                placeholder="e.g. Water Outage Pune South"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Alert Details</label>
              <textarea
                value={alertDesc}
                onChange={(e) => setAlertDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-md3 border border-slate-border outline-none focus:ring-2 focus:ring-danger/20"
                placeholder="Describe weather warnings or infrastructure disruptions..."
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Category</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  className="w-full px-2 py-2 rounded bg-white border border-slate-border outline-none text-xs"
                >
                  <option value="WEATHER">Weather</option>
                  <option value="AQI">Air Quality</option>
                  <option value="DISASTER">Disaster/SOS</option>
                  <option value="TRAFFIC">Traffic</option>
                  <option value="OUTAGE">Power/Water Outage</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Severity</label>
                <select
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value)}
                  className="w-full px-2 py-2 rounded bg-white border border-slate-border outline-none text-xs"
                >
                  <option value="INFO">Information</option>
                  <option value="WARNING">Warning</option>
                  <option value="CRITICAL">Critical Alert</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-danger hover:bg-danger-hover text-white py-2.5 rounded-md3 font-semibold text-sm shadow-sm transition-all"
            >
              Publish Urgent Alert
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
