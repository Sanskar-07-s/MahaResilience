import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  Compass,
  Search,
  MapPin,
  Star,
  Navigation,
  Plus,
  Filter,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { fetchNearbyPlaces, TouristPlace } from '../../services/tourismService.ts';
import { AddPlaceModal } from '../../components/tourism/AddPlaceModal.tsx';
import { DirectionsModal } from '../../components/tourism/DirectionsModal.tsx';
import { db } from '../../lib/firebase.ts';
import { collection, onSnapshot } from 'firebase/firestore';

const createCategoryIcon = (category: string) => {
  let emoji = '📍';
  let color = '#0d9488'; // teal

  const cat = category.toLowerCase();
  if (cat.includes('fort')) {
    emoji = '🏰';
    color = '#8b5cf6';
  } else if (cat.includes('temple') || cat.includes('worship')) {
    emoji = '🛕';
    color = '#f59e0b';
  } else if (cat.includes('water') || cat.includes('lake')) {
    emoji = '🌊';
    color = '#0284c7';
  } else if (cat.includes('beach')) {
    emoji = '🏖️';
    color = '#06b6d4';
  } else if (cat.includes('nature') || cat.includes('park')) {
    emoji = '🌲';
    color = '#10b981';
  } else if (cat.includes('food') || cat.includes('restaurant')) {
    emoji = '🍴';
    color = '#ef4444';
  } else if (cat.includes('hotel') || cat.includes('stay')) {
    emoji = '🏨';
    color = '#6366f1';
  } else if (cat.includes('historic') || cat.includes('museum')) {
    emoji = '📜';
    color = '#d97706';
  }

  return L.divIcon({
    className: 'tourism-category-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transform:translate(-50%,-100%);">
        <div style="background:${color};color:white;padding:4px 8px;border-radius:14px;border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:14px;font-weight:bold;display:flex;align-items:center;gap:4px;">
          <span>${emoji}</span>
        </div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color};"></div>
      </div>
    `,
    iconSize: [36, 40],
    iconAnchor: [18, 40],
    popupAnchor: [0, -36],
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-pin-marker',
  html: `
    <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:28px;height:28px;background:rgba(13,148,136,0.4);border-radius:9999px;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="width:16px;height:16px;background:#0d9488;border:3px solid white;border-radius:9999px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.3);"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export const TourismPage: React.FC = () => {
  const { latitude, longitude, ward, city, district, state } = useLocation();
  const navigate = useNavigate();

  const userLat = latitude || 18.5204;
  const userLng = longitude || 73.8567;

  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [radiusFilter, setRadiusFilter] = useState(200000); // 200km default for all nearby locations
  const [sortOption, setSortOption] = useState<'NEAREST' | 'RATING' | 'REVIEWS' | 'VERIFIED'>('NEAREST');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [directionsTarget, setDirectionsTarget] = useState<TouristPlace | null>(null);

  const categories = [
    { label: 'All Places', value: 'ALL', icon: '📍' },
    { label: 'Forts', value: 'Forts', icon: '🏰' },
    { label: 'Temples', value: 'Temples', icon: '🛕' },
    { label: 'Waterfalls', value: 'Waterfalls', icon: '🌊' },
    { label: 'Beaches', value: 'Beaches', icon: '🏖️' },
    { label: 'Nature', value: 'Nature', icon: '🌲' },
    { label: 'Historical', value: 'Historical', icon: '📜' },
    { label: 'Museums', value: 'Museums', icon: '🏛️' },
    { label: 'Adventure', value: 'Trekking', icon: '🧗' },
    { label: 'Food & Cafes', value: 'Food', icon: '🍴' },
    { label: 'Hotels & Stays', value: 'Hotels', icon: '🏨' },
  ];

  const loadPlaces = async () => {
    setLoading(true);
    const data = await fetchNearbyPlaces(userLat, userLng, radiusFilter, activeCategory, 100);
    setPlaces(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPlaces();

    // Real-time Firestore sync when new places are added by any citizen
    const unsub = onSnapshot(collection(db, 'places'), () => {
      loadPlaces();
    });

    return () => unsub();
  }, [userLat, userLng, activeCategory, radiusFilter]);

  // Filtered & Sorted Places
  const processedPlaces = places
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortOption === 'NEAREST') return (a.distanceKm || 0) - (b.distanceKm || 0);
      if (sortOption === 'RATING') return b.ratingAvg - a.ratingAvg;
      if (sortOption === 'REVIEWS') return b.reviewCount - a.reviewCount;
      if (sortOption === 'VERIFIED') return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
      return 0;
    });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Hero Search Header */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-400/30 rounded-full text-xs font-bold text-teal-300">
            <MapPin className="w-3.5 h-3.5" />
            <span>Active Locality: {ward || city}, {district} District</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Discover <span className="text-teal-400">Maharashtra</span> Tourism & Community Places
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Explore ancient forts, sacred temples, monsoon waterfalls, hidden treks, and local cuisine near{' '}
            <strong className="text-teal-300">{district}</strong>. Contributed & verified by local citizens.
          </p>

          {/* Search Input */}
          <div className="relative pt-2">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search forts, temples, waterfalls near ${district}...`}
              className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white/15 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setActiveCategory(c.value)}
            className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 shrink-0 transition-all shadow-2xs ${
              activeCategory === c.value
                ? 'bg-teal-600 text-white shadow-sm scale-105'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Map & Viewport Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-teal-600" />
          <span>Showing {processedPlaces.length} places in {district}</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto text-xs font-semibold">
          {/* Radius Filter */}
          <select
            value={radiusFilter}
            onChange={(e) => setRadiusFilter(parseInt(e.target.value))}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value={5000}>Within 5 km</option>
            <option value={25000}>Within 25 km</option>
            <option value={50000}>Within 50 km (District)</option>
            <option value={200000}>All Maharashtra (200 km)</option>
          </select>

          {/* Sort Selector */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="NEAREST">Sort: Nearest First</option>
            <option value="RATING">Sort: Highest Rated ⭐</option>
            <option value="REVIEWS">Sort: Most Reviewed 💬</option>
            <option value="VERIFIED">Sort: Verified First ✓</option>
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Place
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Leaflet Map */}
      <div className="h-80 sm:h-96 w-full rounded-3xl overflow-hidden border border-slate-200 shadow-md relative bg-slate-100 z-10">
        <MapContainer center={[userLat, userLng]} zoom={10} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* User Location Marker */}
          <Marker position={[userLat, userLng]} icon={userLocationIcon}>
            <Popup>
              <div className="p-1 text-xs font-bold text-teal-800">
                📍 You are here ({ward || city}, {district})
              </div>
            </Popup>
          </Marker>

          {/* Places Markers */}
          {processedPlaces.map((place) => (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createCategoryIcon(place.category)}
            >
              <Popup>
                <div className="p-2 space-y-1 text-xs max-w-xs">
                  <div className="font-extrabold text-slate-800 flex items-center gap-1">
                    {place.name}
                    {place.verified && <span className="text-teal-600 font-bold">✓</span>}
                  </div>
                  <div className="text-slate-500 text-[11px]">{place.category} • {place.district}</div>
                  <div className="text-teal-700 font-bold text-[11px]">📍 {place.distanceKm} km away</div>
                  <button
                    onClick={() => navigate(`/tourism/place/${place.id}`)}
                    className="w-full mt-2 py-1 bg-teal-600 text-white font-bold rounded-lg text-[10px] text-center"
                  >
                    View Place Details ➔
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-[1000]">
            <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
              Searching Geoapify & Community Database...
            </div>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedPlaces.map((place) => (
          <div
            key={place.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Cover Image Header */}
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img
                  src={
                    place.images?.[0] ||
                    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80'
                  }
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white font-bold text-[10px] rounded-xl uppercase tracking-wider">
                    {place.category}
                  </span>
                  {place.verified && (
                    <span className="px-2.5 py-1 bg-teal-600 text-white font-bold text-[10px] rounded-xl flex items-center gap-1 shadow-xs">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-white/95 backdrop-blur-md text-teal-800 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" /> {place.distanceKm} km
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-extrabold text-slate-800 text-base leading-snug line-clamp-1 group-hover:text-teal-700 transition-colors">
                    {place.name}
                  </h3>

                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{place.ratingAvg}</span>
                    <span className="text-slate-400 text-[10px]">({place.reviewCount})</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{place.description}</p>

                <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-500 border-t border-slate-100">
                  <span className="truncate">📍 {place.city || place.district}, {place.state}</span>
                  {place.openingHours && <span className="shrink-0 font-medium">🕒 {place.openingHours}</span>}
                </div>
              </div>
            </div>

            {/* Card Action Footer */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => navigate(`/tourism/place/${place.id}`)}
                className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1 transition-all"
              >
                View Details <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setDirectionsTarget(place)}
                className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                title="Get Directions"
              >
                <Navigation className="w-4 h-4" /> Directions
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Add Place Button for Mobile */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs sm:hidden transition-all scale-105 active:scale-95"
      >
        <Plus className="w-6 h-6" />
        <span>Add Place</span>
      </button>

      {/* Modals */}
      <AddPlaceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newPlace) => {
          if (newPlace) {
            setPlaces((prev) => [newPlace, ...prev]);
          }
          loadPlaces();
        }}
      />

      {directionsTarget && (
        <DirectionsModal
          isOpen={!!directionsTarget}
          onClose={() => setDirectionsTarget(null)}
          startLat={userLat}
          startLng={userLng}
          destLat={directionsTarget.latitude}
          destLng={directionsTarget.longitude}
          placeName={directionsTarget.name}
          placeAddress={directionsTarget.address}
        />
      )}
    </div>
  );
};

export default TourismPage;
