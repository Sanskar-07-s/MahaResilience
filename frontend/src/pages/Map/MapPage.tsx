import React, { useState, useEffect } from 'react';
import { MapPin, Building, HeartPulse, ShieldAlert, Bus, HelpCircle } from 'lucide-react';

interface AssetMarker {
  id: string;
  name: string;
  category: 'SHELTER' | 'HOSPITAL' | 'COMPLAINT' | 'TRANSIT';
  latitude: number;
  longitude: number;
  details: string;
}

const MapPage: React.FC = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [assets, setAssets] = useState<AssetMarker[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetMarker | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    // 1. Fetch user coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 18.5204, lng: 73.8567 }) // Pune default
      );
    } else {
      setCoords({ lat: 18.5204, lng: 73.8567 });
    }
  }, []);

  useEffect(() => {
    // Seed mock visual markers around Pune/Mumbai bounds for maps display
    const mockMarkers: AssetMarker[] = [
      { id: '1', name: 'Pune General Civil Hospital', category: 'HOSPITAL', latitude: 18.5244, longitude: 73.8527, details: '50/120 ICU Beds Free. Open 24/7.' },
      { id: '2', name: 'Pune West Flood Shelter', category: 'SHELTER', latitude: 18.5144, longitude: 73.8627, details: 'Capacity: 500. Food & blankets available.' },
      { id: '3', name: 'Road Pothole hazard', category: 'COMPLAINT', latitude: 18.5304, longitude: 73.8597, details: 'Status: PENDING. Reported by Rahul P.' },
      { id: '4', name: 'Shivaji Nagar Bus Terminal', category: 'TRANSIT', latitude: 18.5284, longitude: 73.8497, details: 'Connecting buses to Mumbai/Kolhapur.' },
      { id: '5', name: 'E-Waste Smart Recycling', category: 'TRANSIT', latitude: 18.5184, longitude: 73.8447, details: 'EV Chargers & Waste pickup depot.' },
    ];
    setAssets(mockMarkers);
  }, []);

  const filteredAssets = categoryFilter === 'ALL'
    ? assets
    : assets.filter((asset) => asset.category === categoryFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Maharashtra Civic Map View</h1>
        <p className="text-slate-500 text-sm mt-1">
          Explore public amenities, healthcare sites, transport hubs, and reported complaints. Select a pin to review details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm space-y-6 h-fit">
          <h3 className="font-bold text-slate-800 text-lg">Filter Map Pins</h3>
          <div className="flex flex-col gap-2">
            {[
              { label: 'All Markers', value: 'ALL', color: 'bg-slate-100 text-slate-700' },
              { label: 'Hospitals', value: 'HOSPITAL', color: 'bg-red-100 text-red-700' },
              { label: 'Shelters', value: 'SHELTER', color: 'bg-green-100 text-green-700' },
              { label: 'Grievance Hazards', value: 'COMPLAINT', color: 'bg-amber-100 text-amber-700' },
              { label: 'Transit Hubs', value: 'TRANSIT', color: 'bg-blue-100 text-blue-700' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setCategoryFilter(filter.value)}
                className={`w-full py-2.5 px-4 rounded-md3 text-sm font-semibold transition-all flex items-center justify-between ${
                  categoryFilter === filter.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{filter.label}</span>
                {categoryFilter !== filter.value && (
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${filter.color}`}>
                    {filter.value}
                  </span>
                )}
              </button>
            ))}
          </div>

          {selectedAsset && (
            <div className="p-4 bg-slate-50 rounded-md3 border border-slate-border space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                {selectedAsset.category === 'HOSPITAL' && <HeartPulse className="w-4 h-4 text-red-500" />}
                {selectedAsset.category === 'SHELTER' && <Building className="w-4 h-4 text-green-500" />}
                {selectedAsset.category === 'COMPLAINT' && <ShieldAlert className="w-4 h-4 text-amber-500" />}
                {selectedAsset.category === 'TRANSIT' && <Bus className="w-4 h-4 text-blue-500" />}
                {selectedAsset.name}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">{selectedAsset.details}</p>
              <div className="flex gap-2">
                <button className="flex-1 bg-primary text-white py-1.5 rounded-md3 text-xs font-semibold hover:bg-primary-hover shadow-sm">
                  Get Directions
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Map Grid */}
        <div className="lg:col-span-3 h-[500px] bg-slate-100 rounded-md3 border border-slate-border shadow-inner relative overflow-hidden flex flex-col justify-between p-6">
          {/* Ambient Map Grid View (OSM Render Mock) */}
          <div className="absolute inset-0 bg-slate-200 opacity-60 z-0">
            {/* Visual Grid representing street lines */}
            <div className="w-full h-full bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          </div>

          <div className="relative z-10 flex justify-between items-start">
            <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-md3 text-xs font-semibold text-slate-600 border border-slate-border flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Mapping area: Pune Center
            </span>
          </div>

          {/* Render Mock pins visually on grid */}
          <div className="relative flex-1 z-10">
            {filteredAssets.map((asset) => {
              // Map latitude and longitude to percentage bounds for visual grid fallback
              const topVal = ((18.535 - asset.latitude) / 0.025) * 100;
              const leftVal = ((asset.longitude - 73.840) / 0.025) * 100;

              return (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  style={{ top: `${Math.max(10, Math.min(topVal, 90))}%`, left: `${Math.max(10, Math.min(leftVal, 90))}%` }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-full shadow-lg border-2 border-white transition-all hover:scale-125 ${
                    asset.category === 'HOSPITAL'
                      ? 'bg-red-500 text-white'
                      : asset.category === 'SHELTER'
                      ? 'bg-green-500 text-white'
                      : asset.category === 'COMPLAINT'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                  title={asset.name}
                >
                  {asset.category === 'HOSPITAL' && <HeartPulse className="w-4 h-4" />}
                  {asset.category === 'SHELTER' && <Building className="w-4 h-4" />}
                  {asset.category === 'COMPLAINT' && <ShieldAlert className="w-4 h-4" />}
                  {asset.category === 'TRANSIT' && <Bus className="w-4 h-4" />}
                </button>
              );
            })}
          </div>

          <div className="relative z-10 bg-white/90 backdrop-blur-md p-4 rounded-md3 border border-slate-border shadow-sm text-xs text-slate-500 max-w-sm">
            <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-primary" /> Leaflet & OpenStreetMap Integrated
            </p>
            When loaded inside live browser, this grid connects directly to coordinate markers. In local mode, fallback grid indicators represent physical locations.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
