import React, { useState } from 'react';
import { Zap, MapPin, Clock, PhoneCall } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { db } from '../../lib/firebase.ts';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext.tsx';

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
          Official MSEDCL distribution announcements, toll-free support helplines, and citizen power outage reporting for {district}.
        </p>
      </div>

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

          <form onSubmit={handleSubmitOutage} className="pt-3 border-t border-slate-100 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Report Power Outage or Transformer Hazard</h4>
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
              <option value="OUTAGE">Unscheduled Power Outage</option>
              <option value="VOLTAGE_FLVCTUATION">High / Low Voltage Fluctuation</option>
              <option value="TRANSFORMER_SPARK">Transformer Spark / Wire Hazard</option>
              <option value="STREETLIGHT_OUT">Streetlight Inoperative</option>
            </select>
            <textarea
              rows={2}
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              placeholder="Provide exact street location or pole number..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-xs"
            >
              {submitting ? 'Submitting...' : 'Log Outage Report to Firestore'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-amber-600" /> MSEDCL Official Support
          </h3>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="font-bold text-slate-800">Toll-Free Outage Helpline</div>
              <div className="text-amber-700 font-mono text-sm font-bold mt-1">1912 / 1800-233-3435</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="font-bold text-slate-800">{district} MSEDCL Division Desk</div>
              <div className="text-slate-700 font-mono text-xs mt-1">Official Toll-Free Portal</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectricityPage;
