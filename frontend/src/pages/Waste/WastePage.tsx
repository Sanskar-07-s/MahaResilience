import React, { useState } from 'react';
import { Trash2, MapPin, Camera, Send, CheckCircle2, Clock } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';

export const WastePage: React.FC = () => {
  const { ward, city, district, latitude, longitude } = useLocation();
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const schedules = [
    { type: 'Wet / Organic Waste', days: 'Daily (Mon - Sun)', time: '07:00 AM - 09:30 AM', vehicle: 'Municipal Ghanta Gadi' },
    { type: 'Dry / Recyclable Waste', days: 'Mon, Wed, Fri', time: '08:00 AM - 11:00 AM', vehicle: 'Recycling Truck' },
    { type: 'Hazardous / E-Waste', days: '1st Saturday of Month', time: '10:00 AM - 04:00 PM', vehicle: 'Drop Center' },
  ];

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setDescription('');
      setSubmitted(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-slate-800 text-white p-6 md:p-8 rounded-2xl shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2 border border-white/20">
          <MapPin className="w-3.5 h-3.5" /> Municipal Sanitation for {ward || city}, {district}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Waste Management & Door-to-Door Collection</h1>
        <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
          Check daily garbage pickup timings, nearest e-waste drop centers, or submit illegal dumping reports with auto-captured GPS location.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Schedule */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-border shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-emerald-600" /> Door-to-Door Pickup Timetable
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {schedules.map((s, idx) => (
              <div key={idx} className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col justify-between space-y-2">
                <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded w-fit uppercase">
                  {s.type}
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{s.days}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-emerald-600" /> {s.time}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Vehicle: {s.vehicle}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Report Illegal Dumping Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-border shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" /> Report Garbage / Dumping Issue
          </h3>

          {submitted ? (
            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
              <div>Report Logged & Transmitted!</div>
              <div className="text-[10px] text-slate-500">
                GPS Location: {latitude?.toFixed(4)}, {longitude?.toFixed(4)} ({ward}, {district})
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Issue Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe uncollected garbage, overflow bin, or dumping location..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                  required
                ></textarea>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-700 block">Auto-Attached GPS Meta:</span>
                <div>📍 {ward || city}, {district} District</div>
                <div className="font-mono text-[10px] text-slate-400">Lat: {latitude}, Lng: {longitude}</div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Submit Sanitation Complaint
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default WastePage;
