import React, { createContext, useContext, useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';

// Set default CDN marker icons for Leaflet
let DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapContextType {
  coords: { lat: number; lng: number } | null;
  permissionGranted: boolean;
  requestLocation: () => void;
  isDarkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isDarkMode, setDarkMode] = useState(false);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setPermissionGranted(true);
        },
        (err) => {
          console.warn('[Map Provider] Location request denied, falling back to default.', err);
          setCoords({ lat: 18.5204, lng: 73.8567 }); // Pune default
          setPermissionGranted(false);
        }
      );
    }
  };

  useEffect(() => {
    requestLocation();
    // Hook state to check current document theme settings
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  return (
    <MapContext.Provider value={{ coords, permissionGranted, requestLocation, isDarkMode, setDarkMode }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMapSettings = () => {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMapSettings must be used inside MapProvider');
  return ctx;
};

interface MapWrapperProps {
  children: React.ReactNode;
  height?: string;
  zoom?: number;
}

export const MapWrapper: React.FC<MapWrapperProps> = ({ children, height = '450px', zoom = 13 }) => {
  const { coords, isDarkMode } = useMapSettings();

  if (!coords) {
    return (
      <div style={{ height }} className="w-full bg-slate-100 flex items-center justify-center rounded-md3 border border-slate-border">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-semibold">Locating map grid...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="relative w-full rounded-md3 overflow-hidden border border-slate-border shadow-inner">
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            add: (e) => {
              const container = e.target.getContainer();
              if (isDarkMode) {
                container.style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
              } else {
                container.style.filter = 'none';
              }
            }
          }}
        />
        {children}
      </MapContainer>
    </div>
  );
};
