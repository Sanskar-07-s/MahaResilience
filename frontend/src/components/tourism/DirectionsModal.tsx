import React, { useState, useEffect } from 'react';
import { X, Navigation, Car, Footprints, Bike, ExternalLink, Clock, Compass, MapPin, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { fetchDirections, DirectionResult } from '../../services/tourismService.ts';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  startLat: number;
  startLng: number;
  destLat: number;
  destLng: number;
  placeName: string;
  placeAddress: string;
}

const userMarkerIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="width:24px;height:24px;background:#0284c7;border:3px solid white;border-radius:9999px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destMarkerIcon = L.divIcon({
  className: 'dest-location-marker',
  html: `<div style="width:32px;height:32px;background:#ef4444;color:white;border:2px solid white;border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.3);font-size:16px;">🏰</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export const DirectionsModal: React.FC<DirectionsModalProps> = ({
  isOpen,
  onClose,
  startLat,
  startLng,
  destLat,
  destLng,
  placeName,
  placeAddress,
}) => {
  const [mode, setMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [routeResult, setRouteResult] = useState<DirectionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const getRoute = async () => {
      setLoading(true);
      const res = await fetchDirections(startLat, startLng, destLat, destLng, mode);
      setRouteResult(res);
      setLoading(false);
    };

    getRoute();
  }, [isOpen, startLat, startLng, destLat, destLng, mode]);

  if (!isOpen) return null;

  const polylineCoords = routeResult?.coordinates || [
    [startLat, startLng],
    [destLat, destLng],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-teal-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-snug">
                Route & Directions to {placeName}
              </h3>
              <p className="text-xs text-teal-200 line-clamp-1 mt-0.5">{placeAddress}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Travel Mode Controls */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex bg-white rounded-2xl p-1 border border-slate-200 gap-1 shadow-2xs">
            <button
              onClick={() => setMode('driving')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === 'driving' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Car className="w-4 h-4" /> Driving
            </button>

            <button
              onClick={() => setMode('walking')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === 'walking' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Footprints className="w-4 h-4" /> Walking
            </button>

            <button
              onClick={() => setMode('cycling')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === 'cycling' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bike className="w-4 h-4" /> Cycling
            </button>
          </div>

          {routeResult && (
            <div className="flex items-center gap-3 text-xs font-bold text-slate-800 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="flex items-center gap-1 text-teal-700">
                <Compass className="w-4 h-4" /> {routeResult.distanceKm} km
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <Clock className="w-4 h-4 text-amber-500" /> ~{routeResult.durationMins} mins
              </span>
            </div>
          )}
        </div>

        {/* Content Body: Map + Turn-by-Turn Steps */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Map Preview */}
          <div className="h-64 md:h-full w-full min-h-[260px] relative bg-slate-100 border-r border-slate-200">
            <MapContainer
              center={[(startLat + destLat) / 2, (startLng + destLng) / 2]}
              zoom={11}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker position={[startLat, startLng]} icon={userMarkerIcon}>
                <Popup>📍 Your Location</Popup>
              </Marker>
              <Marker position={[destLat, destLng]} icon={destMarkerIcon}>
                <Popup>🏰 {placeName}</Popup>
              </Marker>
              {polylineCoords.length > 0 && (
                <Polyline positions={polylineCoords} color="#0d9488" weight={5} opacity={0.8} />
              )}
            </MapContainer>

            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-[1000]">
                <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                  Calculating OSRM Route...
                </div>
              </div>
            )}
          </div>

          {/* Turn-by-Turn Steps List */}
          <div className="p-4 overflow-y-auto space-y-3 max-h-[350px] md:max-h-full text-xs">
            <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600" /> Step-by-Step Directions
            </h4>

            {routeResult?.steps && routeResult.steps.length > 0 ? (
              <ol className="relative border-l-2 border-teal-200 ml-2 space-y-4 pt-1">
                {routeResult.steps.map((step, idx) => (
                  <li key={idx} className="ml-4">
                    <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-teal-600 border-2 border-white text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                      {idx + 1}
                    </span>
                    <div className="font-bold text-slate-800 leading-snug">{step.instruction}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      {step.distance} • {step.duration}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-slate-500 italic p-4 text-center">
                Direct route calculated (~{routeResult?.distanceKm || 0} km). Follow main road signs to destination.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-all"
          >
            Close Route
          </button>

          {routeResult?.externalGoogleMapsUrl && (
            <a
              href={routeResult.externalGoogleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Open in Google Maps
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
