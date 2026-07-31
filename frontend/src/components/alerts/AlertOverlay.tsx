import React from 'react';
import { useDisasterAlerts } from '../../contexts/AlertContext.tsx';
import { ShieldAlert, Volume2, X } from 'lucide-react';

export const AlertOverlay: React.FC = () => {
  const { activeCriticalAlert, dismissCriticalAlert, triggerAlarmSound } = useDisasterAlerts();

  if (!activeCriticalAlert) return null;

  return (
    <div className="fixed inset-0 bg-red-600/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4 sm:p-6 text-white animate-fade-in">
      <div className="max-w-2xl w-full text-center space-y-8 animate-scale-up">
        {/* Animated Beacon Indicator */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <div className="relative rounded-full bg-white p-6 shadow-2xl text-red-600">
            <ShieldAlert className="w-12 h-12 animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          <span className="bg-white/20 border border-white/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-bounce inline-block">
            CRITICAL DISASTER BULLETIN: {activeCriticalAlert.category}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight pt-2">
            {activeCriticalAlert.title}
          </h2>
          <p className="text-red-100 text-sm sm:text-base leading-relaxed max-w-xl mx-auto pt-4">
            {activeCriticalAlert.description}
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <button
            onClick={triggerAlarmSound}
            className="flex items-center gap-2 bg-white/20 border border-white/30 px-5 py-3 rounded-md3 font-semibold text-sm hover:bg-white/30 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            Repeat Alarm Siren
          </button>
          <a
            href={activeCriticalAlert.officialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-red-700 px-6 py-3 rounded-md3 font-bold text-sm hover:bg-red-50 transition-colors shadow-lg"
          >
            View Evacuation Instructions
          </a>
        </div>

        {/* Close trigger */}
        <button
          onClick={dismissCriticalAlert}
          className="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
