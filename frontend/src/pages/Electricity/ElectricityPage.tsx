import React from 'react';
import { Zap, MapPin, Clock, AlertTriangle, PhoneCall, ShieldCheck } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';

export const ElectricityPage: React.FC = () => {
  const { ward, city, district } = useLocation();

  const outages = [
    {
      id: 'e1',
      title: `Scheduled Transformer Upgradation — ${ward || city}`,
      feeder: `${district} Feeder Line 4`,
      time: 'Sunday, 10:00 AM - 01:30 PM',
      status: 'PLANNED MAINTENANCE',
      affectedSectors: `${ward || city} Block A & B`,
      source: 'MSEDCL Maharashtra State Electricity Distribution',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-slate-800 text-white p-6 md:p-8 rounded-2xl shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2 border border-white/20">
          <MapPin className="w-3.5 h-3.5" /> Electricity Grid Info for {ward || city}, {district}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold">MSEDCL Power Outages & Grid Alerts</h1>
        <p className="text-amber-100 text-sm mt-1 max-w-2xl">
          Real-time updates on feeder line maintenance, scheduled power cuts, transformer status, and electricity grievance reporting for {district}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-border shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Outage & Grid Maintenance Announcements
          </h3>

          {outages.map((o) => (
            <div key={o.id} className="p-5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full uppercase">
                  {o.status}
                </span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> {o.time}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm">{o.title}</h4>
              <div className="text-xs text-slate-600 space-y-1">
                <div>Feeder: <span className="font-semibold text-slate-800">{o.feeder}</span></div>
                <div>Affected Area: <span className="font-semibold text-slate-800">{o.affectedSectors}</span></div>
                <div className="text-[11px] text-slate-400 pt-1">Source: {o.source}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-border shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-primary" /> MSEDCL Support Helplines
          </h3>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800">Toll-Free Outage Helpline</div>
              <div className="text-primary font-mono text-sm font-bold mt-1">1912 / 1800-233-3435</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800">{district} Substation Desk</div>
              <div className="text-slate-700 font-mono text-xs mt-1">020-25530101</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectricityPage;
