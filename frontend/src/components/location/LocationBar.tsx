import React, { useState } from 'react';
import { useLocation, MAHARASHTRA_DISTRICTS } from '../../contexts/LocationContext.tsx';
import { LocationPromptModal } from './LocationPromptModal.tsx';
import { MapPin, Navigation, ChevronDown, Check, X, RefreshCw, AlertCircle } from 'lucide-react';

export const LocationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const {
    district: currentDistrict,
    taluka: currentTaluka,
    ward: currentWard,
    source,
    detectLocation,
    setManualLocation,
    locationLoading,
  } = useLocation();

  const [selectedDistrict, setSelectedDistrict] = useState(currentDistrict);
  const [selectedTaluka, setSelectedTaluka] = useState(currentTaluka);
  const [selectedWard, setSelectedWard] = useState(currentWard);

  if (!isOpen) return null;

  const districtData = MAHARASHTRA_DISTRICTS.find(
    (d) => d.district.toLowerCase() === selectedDistrict.toLowerCase()
  ) || MAHARASHTRA_DISTRICTS[0];

  const availableTalukas = districtData.talukas;

  const currentTalukaData = availableTalukas.find(
    (t) => t.name.toLowerCase() === selectedTaluka.toLowerCase()
  ) || availableTalukas[0];

  const availableWards = currentTalukaData.wards;

  const handleApply = () => {
    setManualLocation({
      state: 'Maharashtra',
      district: districtData.district,
      city: districtData.district + ' City',
      taluka: currentTalukaData.name,
      ward: selectedWard || availableWards[0],
      village: selectedWard || availableWards[0],
      lat: districtData.lat,
      lng: districtData.lng,
    });
    onClose();
  };

  const handleUseGps = async () => {
    await detectLocation();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-6 overflow-hidden relative">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">Select Your Location</h3>
              <p className="text-xs text-slate-500">
                Choose your district & locality to filter all civic services
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Detection Button */}
        <button
          onClick={handleUseGps}
          disabled={locationLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-primary text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          {locationLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <span>{locationLoading ? 'Detecting GPS Coordinates...' : 'Use My Current GPS Location'}</span>
        </button>

        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest absolute">
            Or Choose Manually
          </span>
        </div>

        {/* Dropdowns */}
        <div className="space-y-4">
          {/* District Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              District (Maharashtra)
            </label>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  const newDist = e.target.value;
                  setSelectedDistrict(newDist);
                  const newDistData = MAHARASHTRA_DISTRICTS.find((d) => d.district === newDist)!;
                  setSelectedTaluka(newDistData.talukas[0].name);
                  setSelectedWard(newDistData.talukas[0].wards[0]);
                }}
                className="w-full p-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8 text-slate-800"
              >
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d.district} value={d.district}>
                    {d.district} District
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Taluka Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Taluka / Sub-Division
            </label>
            <div className="relative">
              <select
                value={selectedTaluka}
                onChange={(e) => {
                  const newTaluka = e.target.value;
                  setSelectedTaluka(newTaluka);
                  const talData = availableTalukas.find((t) => t.name === newTaluka)!;
                  setSelectedWard(talData.wards[0]);
                }}
                className="w-full p-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8 text-slate-800"
              >
                {availableTalukas.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Ward / Locality Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Ward / Locality / Village
            </label>
            <div className="relative">
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8 text-slate-800"
              >
                {availableWards.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-slate-600 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" /> Apply Location
          </button>
        </div>
      </div>
    </div>
  );
};

export const LocationBar: React.FC = () => {
  const { ward, taluka, district, state, source, isPermissionDenied, isFirstVisitPromptOpen, setIsFirstVisitPromptOpen } = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-slate-900 text-white text-xs py-2 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold text-slate-200">Active Location:</span>
            <span className="font-bold text-white truncate">
              {ward || taluka}, {district}, {state}
            </span>
            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shrink-0 ml-1">
              {source === 'gps' ? 'GPS Active' : 'Manual Selection'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isPermissionDenied && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-amber-400">
              <AlertCircle className="w-3 h-3" /> Location Permission Denied
            </span>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary-light rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            Change Location
          </button>
        </div>
      </div>

      <LocationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* First-Visit Prompt Modal */}
      {isFirstVisitPromptOpen && (
        <LocationPromptModal
          isOpen={isFirstVisitPromptOpen}
          onClose={() => setIsFirstVisitPromptOpen(false)}
          onOpenManualModal={() => setIsModalOpen(true)}
        />
      )}
    </>
  );
};
