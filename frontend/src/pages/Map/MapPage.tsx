import React, { useState, useEffect } from 'react';
import { MapPin, Building, HeartPulse, ShieldAlert, Bus, HelpCircle } from 'lucide-react';
import { MapProvider } from '../../components/maps/MapProvider.tsx';
import { LiveMap } from '../../components/maps/Maps.tsx';

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
        <div className="lg:col-span-3 h-[500px] relative overflow-hidden rounded-md3 border border-slate-border">
          <MapProvider>
            <LiveMap
              assets={filteredAssets.map(a => ({
                id: a.id,
                name: a.name,
                category: a.category,
                latitude: a.latitude,
                longitude: a.longitude,
                address: a.details,
                details: a.details
              }))}
              height="500px"
            />
          </MapProvider>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
