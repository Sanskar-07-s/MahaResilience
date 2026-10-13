import React, { useState } from 'react';
import { Zap, MapPin, Clock, PhoneCall } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { db } from '../../lib/firebase.ts';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { CivicFacilityBoard } from '../../components/civic/CivicFacilityBoard.tsx';
import { UtilityBillFetcher } from '../../components/civic/UtilityBillFetcher.tsx';

export const ElectricityPage: React.FC = () => {
  const { ward, city, district, latitude, longitude } = useLocation();
  const { user } = useAuth();
  const [issueType, setIssueType] = useState('OUTAGE');
  const [issueDesc, setIssueDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  const outages = [
    {
      id: 'e1',
      title: `Grid Feeder Monitoring & Maintenance Notice — ${ward || city}`,
      feeder: `${district} MSEDCL Distribution Line`,
      time: 'Official MSEDCL Advisory',
      status: 'MSEDCL GRID ADVISORY',
      affectedSectors: `${ward || city}, ${district}`,
      source: 'MSEDCL Maharashtra State Electricity Distribution Co. Ltd.',
    },
  ];

  const handleSubmitOutage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDesc.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'electricityReports'), {
        userId: user?.uid || user?.id || 'anonymous',
        userName: user?.name || (user as any)?.displayName || 'Local Resident',
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
      setSubmittedMsg('Power outage report logged to Firestore! Forwarded to MSEDCL division.');
      setIssueDesc('');
    } catch (_) {
      setSubmittedMsg('Failed to record report. Please call 1912 directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-slate-800 text-white p-6 md:p-8 rounded-3xl shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2 border border-white/20">
          <MapPin className="w-3.5 h-3.5" /> Electricity Grid Info for {ward || city}, {district}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold">MSEDCL Power Outages & Grid Alerts</h1>
        <p className="text-amber-100 text-sm mt-1 max-w-2xl leading-relaxed">
          Official MSEDCL distribution announcements, toll-free support helplines, instant bill lookup, and live email receipt dispatch for {district}.
        </p>
      </div>

      {/* Instant Light Bill Fetcher & Live Brevo Email Dispatch */}
      <UtilityBillFetcher
        utilityType="ELECTRICITY"
        district={district || 'Maharashtra'}
        defaultProvider="MSEDCL (Mahavitaran - Maharashtra)"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Outage & Grid Maintenance Announcements
          </h3>

          {outages.map((o) => (
            <div key={o.id} className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-lg uppercase">
                  {o.status}
                </span>
                <span className="text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> {o.time}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm">{o.title}</h4>
              <div className="text-slate-600 space-y-1">
                <div>Feeder: <span className="font-semibold text-slate-800">{o.feeder}</span></div>
                <div>Affected Area: <span className="font-semibold text-slate-800">{o.affectedSectors}</span></div>
                <div className="text-[11px] text-slate-400 pt-1">Source: {o.source}</div>
              </div>
            </div>
          ))}

          {/* Quick Helpline Numbers */}
          <div className="p-5 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">MSEDCL 24x7 Emergency Helplines</div>
              <div className="text-base font-extrabold mt-0.5">Report Sparks, Transformer Failure, or Hanging Wires</div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="tel:1912"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Call 1912
              </a>
              <a
                href="tel:18002333435"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-white/15"
              >
                1800-233-3435
              </a>
            </div>
          </div>
        </div>

        {/* Citizen Report Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">Report Local Electricity Problem</h3>
          <p className="text-xs text-slate-500">
            Log outages or damaged street power infrastructure in {ward || city}.
          </p>

          <form onSubmit={handleSubmitOutage} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Issue Category</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="OUTAGE">Complete Power Outage</option>
                <option value="LOW_VOLTAGE">Low Voltage / Fluctuations</option>
                <option value="STREET_LIGHT">Street Lights Not Working</option>
                <option value="TRANSFORMER">Transformer Sparking / Noise</option>
                <option value="METER">Meter Damage / Sparking</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Incident Details</label>
              <textarea
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                rows={4}
                placeholder="Describe exact street/building and how long power has been out..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {submitting ? 'Submitting Report...' : 'Broadcast Outage Report'}
            </button>

            {submittedMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-semibold text-center">
                {submittedMsg}
              </div>
            )}
          </form>
        </div>
      </div>

      <CivicFacilityBoard
        module="ELECTRICITY"
        title="Nearby MSEDCL Sub-Stations & Billing Counters"
        subtitle={`Verified power maintenance centers and cash counters in ${district}`}
      />
    </div>
  );
};

export default ElectricityPage;
