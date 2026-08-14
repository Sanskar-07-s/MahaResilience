import React from 'react';
import { MapPin, Navigation, Settings, X, ShieldCheck } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';

interface LocationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManualModal: () => void;
}

export const LocationPromptModal: React.FC<LocationPromptModalProps> = ({
  isOpen,
  onClose,
  onOpenManualModal,
}) => {
  const { requestGpsLocation, permissionStatus } = useLocation();

  if (!isOpen) return null;

  const handleUseGps = async () => {
    await requestGpsLocation();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 text-center relative overflow-hidden">
        {/* Background Accent Gradient */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-inner">
          <MapPin className="w-7 h-7 animate-bounce" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-800">📍 Personalize MahaResilience</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Allow location access to see real-time emergency services, disaster alerts, healthcare facilities, and government schemes relevant to your area.
          </p>
        </div>

        {permissionStatus === 'denied' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-2xl text-left flex items-start gap-2">
            <Settings className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Location access is disabled in browser.</strong>
              <div className="text-[11px] text-amber-700 mt-0.5">
                You can choose your district manually below to keep the platform fully operational.
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleUseGps}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Navigation className="w-4 h-4" /> Use My Device GPS Location
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenManualModal();
            }}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-xs border border-slate-200 transition-all"
          >
            Choose Location Manually
          </button>
        </div>

        <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Your privacy is protected. Location data is stored locally on device.</span>
        </div>
      </div>
    </div>
  );
};
