import React, { createContext, useContext, useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';

export const MAPTILER_API_KEY = 'jbJfkspJmcH4r2feSMsv';

export type MapStyle = 'streets' | 'outdoor' | 'dark' | 'satellite';

export const MAPTILER_STYLES: Record<MapStyle, { label: string; url: string; attribution: string }> = {
  streets: {
    label: 'MapTiler Streets',
    url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
    attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>',
  },
  outdoor: {
    label: 'MapTiler Outdoor',
    url: `https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
    attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>',
  },
  dark: {
    label: 'MapTiler Dataviz Dark',
    url: `https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
    attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>',
  },
  satellite: {
    label: 'MapTiler Satellite',
    url: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}`,
    attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>',
  },
};

// Default icon setup fallback
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
  mapStyle: MapStyle;
  setMapStyle: (style: MapStyle) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isDarkMode, setDarkMode] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>('streets');

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
    } else {
      setCoords({ lat: 18.5204, lng: 73.8567 });
    }
  };

  useEffect(() => {
    requestLocation();
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
    if (isDark) {
      setMapStyle('dark');
    }
  }, []);

  return (
    <MapContext.Provider value={{ coords, permissionGranted, requestLocation, isDarkMode, setDarkMode, mapStyle, setMapStyle }}>
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
  showStyleSelector?: boolean;
}

export const MapWrapper: React.FC<MapWrapperProps> = ({ children, height = '450px', zoom = 12, showStyleSelector = true }) => {
  const { coords, mapStyle, setMapStyle } = useMapSettings();
  const currentTile = MAPTILER_STYLES[mapStyle] || MAPTILER_STYLES.streets;

  if (!coords) {
    return (
      <div style={{ height }} className="w-full bg-slate-100 flex items-center justify-center rounded-md3 border border-slate-border">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-semibold">Loading MapTiler vector map grid...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="relative w-full rounded-md3 overflow-hidden border border-slate-border shadow-inner group">
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          key={mapStyle}
          attribution={currentTile.attribution}
          url={currentTile.url}
          tileSize={512}
          zoomOffset={-1}
          maxZoom={19}
        />
        {children}
      </MapContainer>

      {/* MapTiler Style Selector Overlay */}
      {showStyleSelector && (
        <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur-md p-1.5 rounded-lg shadow-md border border-slate-200 flex gap-1 text-xs">
          {(Object.keys(MAPTILER_STYLES) as MapStyle[]).map((st) => (
            <button
              key={st}
              onClick={() => setMapStyle(st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                mapStyle === st
                  ? 'bg-primary text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'streets' && '🗺️ Streets'}
              {st === 'outdoor' && '🏕️ Topo'}
              {st === 'dark' && '🌙 Dark'}
              {st === 'satellite' && '🛰️ Satellite'}
            </button>
          ))}
        </div>
      )}

      {/* MapTiler Attribution Badge */}
      <div className="absolute bottom-2 left-2 z-[400] bg-white/85 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-slate-600 font-mono shadow-xs border border-slate-200/60">
        MapTiler Engine Active
      </div>
    </div>
  );
};

