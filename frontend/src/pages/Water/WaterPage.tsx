import React, { useState } from 'react';
import { Droplets, MapPin, Clock, CheckCircle2, Phone } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { db } from '../../lib/firebase.ts';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext.tsx';

export const WaterPage: React.FC = () => {
  const { ward, city, district, latitude, longitude } = useLocation();
  const { user } = useAuth();
  const [issueType, setIssueType] = useState('LOW_PRESSURE');
  const [issueDesc, setIssueDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  const schedules = [
    { zone: `${ward || city} Morning Supply`, hours: '06:00 AM - 09:30 AM', status: 'ACTIVE', pressure: 'Normal' },
    { zone: `${ward || city} Evening Supply`, hours: '05:30 PM - 08:00 PM', status: 'SCHEDULED', pressure: 'High' },
  ];

  const notices = [
    { id: 'w1', title: `Pipeline Maintenance & Supply Monitoring in ${ward || city}`, status: 'Official Notice', time: 'Today', source: `${district} Municipal Water Works` },
    { id: 'w2', title: `Drinking Water Quality Testing — ${district} Lab`, status: 'Potable Water Tested', time: 'Today', source: 'State Water Authority' },
  ];

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDesc.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'waterRequests'), {
        userId: user?.id || 'anonymous',
        userName: user?.name || 'Local Resident',
        issueType,
        description: issueDesc.trim(),
        district,
        city: city || district,
        ward: ward || city,
        latitude: latitude || 18.5204,
        longitude: longitude || 73.8567,
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
      });
      setSubmittedMsg('Water request submitted successfully to municipal ward office!');
      setIssueDesc('');
    } catch (_) {
      setSubmittedMsg('Failed to record request. Please dial 1916 for immediate assistance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-sky-700 via-cyan-600 to-blue-800 text-white p-6 md:p-8 rounded-3xl shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2 border border-white/20">
          <MapPin className="w-3.5 h-3.5" /> Water Utilities for {ward || city}, {district}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Water Supply Schedules & Grievances</h1>
        <p className="text-cyan-100 text-sm mt-1 max-w-2xl leading-relaxed">
          Track tap water distribution schedules, pipeline maintenance notices, and submit water supply requests directly to {district} municipal authorities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supply Schedules & Citizen Request Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <Droplets className="w-5 h-5 text-sky-600" /> Tap Water Distribution Timetable
          </h3>
          <div className="space-y-3">
            {schedules.map((s, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-slate-800">{s.zone}</h4>
                  <div className="text-slate-500 flex items-center gap-1 mt-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-sky-600" /> {s.hours}
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase">
                  {s.status}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmitRequest} className="pt-3 border-t border-slate-100 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Report Water Issue or Tanker Request</h4>
            {submittedMsg && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-semibold">
                {submittedMsg}
              </div>
            )}
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-none"
            >
              <option value="LOW_PRESSURE">Low Tap Water Pressure</option>
              <option value="NO_SUPPLY">No Water Supply / Interrupted</option>
              <option value="PIPE_LEAK">Main Pipeline Water Leakage</option>
              <option value="TANKER_REQUEST">Emergency Water Tanker Request</option>
            </select>
            <textarea
              rows={2}
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              placeholder="Describe location details or specific requirement..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl transition-all shadow-xs"
            >
              {submitting ? 'Submitting...' : 'Submit Water Request to Firestore'}
            </button>
          </form>
        </div>

        {/* Notices & Tanker Booking */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Department Notices & Helplines
          </h3>
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n.id} className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-1 text-xs">
                <span className="text-[10px] font-bold bg-sky-200 text-sky-800 px-2 py-0.5 rounded-lg">{n.status}</span>
                <h4 className="font-bold text-slate-800 pt-0.5">{n.title}</h4>
                <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                  <span>Source: {n.source}</span>
                  <span>{n.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <a
              href="tel:1916"
              className="w-full py-3 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Phone className="w-4 h-4" /> Book Municipal Water Tanker (Dial 1916)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterPage;
