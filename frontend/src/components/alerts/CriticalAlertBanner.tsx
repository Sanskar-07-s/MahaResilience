import React, { useState } from 'react';
import { ShieldAlert, ChevronRight, X } from 'lucide-react';
import { useDisasterAlerts } from '../../contexts/AlertContext.tsx';
import { useLocation } from '../../contexts/LocationContext.tsx';

export const CriticalAlertBanner: React.FC = () => {
  const { activeCriticalAlert, dismissCriticalAlert } = useDisasterAlerts();
  const { district } = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!activeCriticalAlert || isDismissed) return null;

  return (
    <div className="sticky top-16 z-40 bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md border-b-2 border-red-800 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-md3 bg-white/20 text-white shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse text-yellow-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-yellow-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                CRITICAL LOCAL ALERT
              </span>
              <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
                {activeCriticalAlert.district || district || 'Local District'}
              </span>
            </div>
            <p className="font-bold text-sm truncate mt-0.5">{activeCriticalAlert.title}</p>
            <p className="text-xs text-red-100 line-clamp-1 hidden sm:block mt-0.5">
              {activeCriticalAlert.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/alerts"
            className="inline-flex items-center gap-1 text-xs font-bold bg-white text-red-700 px-3 py-1.5 rounded-md3 hover:bg-red-50 transition-all shadow-sm"
          >
            View Details
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => {
              setIsDismissed(true);
              dismissCriticalAlert();
            }}
            className="p-1 rounded-full text-red-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Minimize"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
