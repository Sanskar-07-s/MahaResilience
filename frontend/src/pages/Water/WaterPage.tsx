import React from 'react';
import { Droplets, MapPin, Clock, AlertTriangle, CheckCircle2, Phone } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';

export const WaterPage: React.FC = () => {
  const { ward, city, district } = useLocation();

  const schedules = [
    { zone: `${ward || city} Morning Supply`, hours: '06:00 AM - 09:30 AM', status: 'ACTIVE', pressure: 'Normal' },
    { zone: `${ward || city} Evening Supply`, hours: '05:30 PM - 08:00 PM', status: 'SCHEDULED', pressure: 'High' },
  ];

  const notices = [
    { id: 'w1', title: `Pipeline Cleaning in ${ward || city}`, status: 'Scheduled Maintenance', time: 'Tomorrow 10:00 AM', source: `${district} Water Department` },
    { id: 'w2', title: `Quality Test Passed — ${district} Municipal Lab`, status: 'Potable Drinking Water', time: 'Today 07:00 AM', source: 'State Water Board' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-700 via-cyan-600 to-blue-800 text-white p-6 md:p-8 rounded-2xl shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2 border border-white/20">
          <MapPin className="w-3.5 h-3.5" /> Water Utilities for {ward || city}, {district}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Water Supply Schedules & Quality Notices</h1>
        <p className="text-cyan-100 text-sm mt-1 max-w-2xl">
          Track real-time tap water distribution schedules, pipeline maintenance alerts, and municipal water tank bookings for {district}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supply Schedules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-border shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <Droplets className="w-5 h-5 text-sky-600" /> Tap Water Distribution Timetable
          </h3>
          <div className="space-y-3">
            {schedules.map((s, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{s.zone}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3.5 h-3.5 text-sky-600" /> {s.hours}
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase">
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notices & Tanker Booking */}
        <div className="bg-white p-6 rounded-2xl border border-slate-border shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Department Notices & Helplines
          </h3>
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n.id} className="p-4 bg-sky-50/60 rounded-xl border border-sky-100 space-y-1">
                <span className="text-[10px] font-bold bg-sky-200 text-sky-800 px-2 py-0.5 rounded">{n.status}</span>
                <h4 className="font-bold text-slate-800 text-xs">{n.title}</h4>
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
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
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
