import React from 'react';
import { Bus, MapPin, Search, Navigation, Clock, Zap } from 'lucide-react';
import { useLocation, haversineDistance } from '../../contexts/LocationContext.tsx';

const TransportPage: React.FC = () => {
  const { ward, city, district, latitude, longitude } = useLocation();
  const userLat = latitude || 18.5204;
  const userLng = longitude || 73.8567;

  const routes = [
    { code: `${district.toUpperCase()}-BUS-01`, origin: `${ward || city} MSRTC Bus Depot`, dest: `${district} Central Station`, type: 'MSRTC Bus', freq: 'Every 15 Mins', status: 'ON TIME', lat: userLat + 0.005, lng: userLng + 0.007 },
    { code: `${district.toUpperCase()}-MET-02`, origin: `${district} Metro Interchange`, dest: `${ward || city} Station`, type: 'Metro Line', freq: 'Every 5 Mins', status: 'ON TIME', lat: userLat - 0.008, lng: userLng + 0.012 },
    { code: `${district.toUpperCase()}-EV-03`, origin: `${district} Collector Office EV Hub`, dest: 'Fast DC Chargers Active', type: 'EV Fast Station', freq: '3/4 Chargers Free', status: 'ACTIVE', lat: userLat + 0.011, lng: userLng - 0.004 },
  ].map((r) => ({
    ...r,
    distance: haversineDistance(userLat, userLng, r.lat, r.lng),
  })).sort((a, b) => a.distance - b.distance);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-slate-800 text-white p-6 md:p-8 rounded-2xl shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2 border border-white/20">
          <MapPin className="w-3.5 h-3.5" /> Transport Hubs for {ward || city}, {district}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Public Transit, Railways & EV Charging</h1>
        <p className="text-blue-100 text-sm mt-1 max-w-2xl">
          Locate state MSRTC bus terminals, local metro connections, railway junctions, and operational electric vehicle (EV) charging hubs near {district}.
        </p>
      </div>

      <div className="space-y-4 max-w-5xl">
        {routes.map((route) => (
          <div key={route.code} className="bg-white p-6 rounded-2xl border border-slate-border shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold uppercase">
                  {route.type}
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-blue-200">
                  <Navigation className="w-3 h-3 text-blue-600" /> {route.distance} km away
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 pt-0.5">
                <Bus className="w-5 h-5 text-blue-600 shrink-0" />
                {route.origin} → {route.dest}
              </h3>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block">Frequency</span>
              <span className="font-bold text-slate-700 text-sm">{route.freq}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold block mt-1 w-fit sm:ml-auto">
                {route.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransportPage;

