import React, { useState } from 'react';
import { MapPin, ShieldAlert, CheckCircle, Navigation, Bell, Globe } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { useDisasterAlerts, DisasterAlert } from '../../contexts/AlertContext.tsx';

const AlertsPage: React.FC = () => {
  const { ward, city, district } = useLocation();
  const { localAlerts, broaderAlerts, isLoading } = useDisasterAlerts();
  const [activeTab, setActiveTab] = useState<'LOCAL' | 'BROADER'>('LOCAL');

  const activeList = activeTab === 'LOCAL' ? localAlerts : broaderAlerts;
  const hasCritical = localAlerts.some((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Risk Banner */}
      <div
        className={`p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-white/10 ${
          hasCritical
            ? 'bg-gradient-to-r from-red-700 via-rose-800 to-slate-900'
            : 'bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-white mb-2 border border-white/20">
              <MapPin className="w-3.5 h-3.5" /> Regional Alerts for {ward || city}, {district}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {hasCritical ? '⚠️ ELEVATED RISK WATCH ACTIVE' : '✅ ALL CLEAR & NORMAL ADVISORY'}
            </h1>
            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Official bulletins & emergency advisories issued specifically for citizens residing in{' '}
              <strong className="text-white font-bold">{ward || city}, {district}</strong>.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs text-center shrink-0">
            <span className="text-white/80 uppercase font-bold block text-[10px]">District Risk Level</span>
            <span className="text-lg font-black text-white">{hasCritical ? 'MODERATE / HIGH' : 'NORMAL / LOW'}</span>
          </div>
        </div>
      </div>

      {/* Local vs Broader Notifications Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-2 max-w-md text-xs font-bold">
        <button
          onClick={() => setActiveTab('LOCAL')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'LOCAL'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Local Alerts ({district})</span>
          <span className="px-1.5 py-0.5 bg-white/20 rounded-md text-[10px]">{localAlerts.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('BROADER')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'BROADER'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Broader Maharashtra</span>
          <span className="px-1.5 py-0.5 bg-white/20 rounded-md text-[10px]">{broaderAlerts.length}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeList.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
          <CheckCircle className="w-8 h-8 text-teal-600 mx-auto" />
          <div className="font-bold text-slate-800 text-sm">No Active Advisories</div>
          <p className="text-xs text-slate-500">
            {activeTab === 'LOCAL'
              ? `There are no emergency alerts affecting ${district} district.`
              : 'No broader statewide alerts reported.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-5xl">
          {activeList.map((alert, idx) => (
            <div
              key={alert.id || idx}
              className={`p-6 rounded-3xl border shadow-xs space-y-4 transition-all ${
                alert.severity === 'CRITICAL'
                  ? 'bg-red-50/90 border-red-200'
                  : alert.severity === 'HIGH'
                  ? 'bg-amber-50/90 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`p-2.5 rounded-2xl text-white shrink-0 ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-600'
                        : alert.severity === 'HIGH'
                        ? 'bg-amber-600'
                        : 'bg-blue-600'
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg font-extrabold text-slate-700 uppercase">
                        {alert.category}
                      </span>
                      {alert.district && (
                        <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-lg">
                          📍 {alert.district}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800 pt-1">{alert.title}</h3>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 shrink-0">
                  <div>Source: <strong className="text-slate-700">IMD / NDMA Sachet</strong></div>
                  <div>Published: {new Date(alert.publishedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              <p className="text-slate-700 text-xs leading-relaxed">{alert.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Safety Precaution
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    Keep emergency battery backup, drinking water, and first aid supplies accessible.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                    <Navigation className="w-3.5 h-3.5 text-teal-600" /> District Shelter Point
                  </span>
                  <p className="text-slate-600 text-[11px] font-semibold text-teal-800">
                    {district} Relief & Medical Base Shelter
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
