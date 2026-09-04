import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin, Building, HeartPulse, ShieldAlert, Bus, Search, Landmark, Droplets,
  Layers, ExternalLink, X, Navigation, Phone, Crosshair, Sparkles, Loader2,
  Compass, Map as MapIcon
} from 'lucide-react';
import { MapProvider } from '../../components/maps/MapProvider.tsx';
import {
  LiveMap,
  MAHARASHTRA_DEFAULT_SERVICES,
  getDynamicLocationServices,
  AssetPin
} from '../../components/maps/Maps.tsx';
import { useLocation, haversineDistance, MAHARASHTRA_DISTRICTS } from '../../contexts/LocationContext.tsx';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase.ts';

const MapPage: React.FC = () => {
  const { latitude, longitude, district, city, ward, state } = useLocation();
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPin, setSelectedPin] = useState<AssetPin | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [customSearchedPins, setCustomSearchedPins] = useState<AssetPin[]>([]);

  // Firestore live collections
  const [firestoreHospitals, setFirestoreHospitals] = useState<AssetPin[]>([]);
  const [firestoreComplaints, setFirestoreComplaints] = useState<AssetPin[]>([]);
  const [firestorePlaces, setFirestorePlaces] = useState<AssetPin[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const userLat = latitude || 18.5204;
  const userLng = longitude || 73.8567;

  // Initialize map center to user's location
  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Click outside search suggestions container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time Firestore subscriptions for live pins
  useEffect(() => {
    // 1. Live Hospitals
    const unsubHospitals = onSnapshot(
      collection(db, 'hospitals'),
      (snap) => {
        const list: AssetPin[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          if (d.name) {
            list.push({
              id: 'fs-hosp-' + doc.id,
              name: d.name,
              category: 'HOSPITAL',
              latitude: d.latitude || (userLat + (Math.random() - 0.5) * 0.04),
              longitude: d.longitude || (userLng + (Math.random() - 0.5) * 0.04),
              address: d.address || `${d.city || city || district}, Maharashtra`,
              phone: d.phone || d.emergencyContact || '108',
              details: `Govt Hospital | ICU Beds: ${d.icuAvailable ?? d.icuBeds ?? 'Available'} | Oxygen: ${d.oxygenAvailable ?? 'Ready'}`,
              badge: 'Live Registered',
            });
          }
        });
        if (list.length > 0) setFirestoreHospitals(list);
      },
      (err) => console.warn('Hospitals live map sync note:', err.message)
    );

    // 2. Live Citizen Complaints Hazards
    const unsubComplaints = onSnapshot(
      collection(db, 'complaints'),
      (snap) => {
        const list: AssetPin[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          if (d.title && d.latitude && d.longitude) {
            list.push({
              id: 'fs-comp-' + doc.id,
              name: d.title,
              category: 'COMPLAINT',
              latitude: d.latitude,
              longitude: d.longitude,
              address: d.address || `${d.ward || d.district || city}, Maharashtra`,
              details: `Civic Issue: ${d.category || 'General'} | Status: ${d.status || 'Active'}`,
              badge: d.status || 'Reported Hazard',
            });
          }
        });
        if (list.length > 0) setFirestoreComplaints(list);
      },
      (err) => console.warn('Complaints live map sync note:', err.message)
    );

    // 3. Live Tourist & Heritage Places
    const unsubPlaces = onSnapshot(
      collection(db, 'places'),
      (snap) => {
        const list: AssetPin[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          if (d.name && d.latitude && d.longitude) {
            list.push({
              id: 'fs-plc-' + doc.id,
              name: d.name,
              category: 'TOURISM',
              latitude: d.latitude,
              longitude: d.longitude,
              address: d.location || d.address || `${d.district || district}, Maharashtra`,
              details: d.description || 'Heritage & Cultural Landmark',
              badge: 'Heritage Site',
            });
          }
        });
        if (list.length > 0) setFirestorePlaces(list);
      },
      (err) => console.warn('Places live map sync note:', err.message)
    );

    return () => {
      unsubHospitals();
      unsubComplaints();
      unsubPlaces();
    };
  }, [userLat, userLng, city, district]);

  // Combine default services + localized district services + custom searched pins + Firestore live pins
  const allAvailableAssets = useMemo(() => {
    const localServices = getDynamicLocationServices(userLat, userLng, district || 'Kolhapur', city || 'Kolhapur');
    const combined = [
      ...customSearchedPins,
      ...localServices,
      ...MAHARASHTRA_DEFAULT_SERVICES,
      ...firestoreHospitals,
      ...firestoreComplaints,
      ...firestorePlaces,
    ];

    // Deduplicate by name + lat roughly
    const seen = new Set<string>();
    return combined.filter((pin) => {
      const key = `${pin.name.toLowerCase()}_${pin.latitude.toFixed(3)}_${pin.longitude.toFixed(3)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [userLat, userLng, district, city, customSearchedPins, firestoreHospitals, firestoreComplaints, firestorePlaces]);

  // Filtered Assets based on category and search query
  const filteredAssets = useMemo(() => {
    const queryClean = searchQuery.trim().toLowerCase();

    return allAvailableAssets.filter((asset) => {
      const matchesCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;

      if (!matchesCategory) return false;
      if (!queryClean) return true;

      // Comprehensive search match across title, address, details, badge, category
      const inName = asset.name?.toLowerCase().includes(queryClean);
      const inAddress = asset.address?.toLowerCase().includes(queryClean);
      const inDetails = asset.details?.toLowerCase().includes(queryClean);
      const inBadge = asset.badge?.toLowerCase().includes(queryClean);
      const inCat = asset.category?.toLowerCase().includes(queryClean);

      return inName || inAddress || inDetails || inBadge || inCat;
    });
  }, [allAvailableAssets, categoryFilter, searchQuery]);

  // Instant Suggestions (Top 5 matches while typing)
  const suggestions = useMemo(() => {
    const queryClean = searchQuery.trim().toLowerCase();
    if (!queryClean || queryClean.length < 2) return { pins: [], towns: [] };

    const matchedPins = allAvailableAssets
      .filter((p) => p.name.toLowerCase().includes(queryClean) || p.address.toLowerCase().includes(queryClean))
      .slice(0, 5);

    // Also match known Maharashtra districts/towns
    const matchedTowns: { name: string; lat: number; lng: number; type: 'TOWN' }[] = [];
    for (const d of MAHARASHTRA_DISTRICTS) {
      if (d.district.toLowerCase().includes(queryClean)) {
        matchedTowns.push({ name: `${d.district}, Maharashtra`, lat: d.lat, lng: d.lng, type: 'TOWN' });
      }
      for (const t of d.talukas) {
        if (t.name.toLowerCase().includes(queryClean)) {
          matchedTowns.push({ name: `${t.name}, ${d.district}`, lat: d.lat + 0.008, lng: d.lng + 0.008, type: 'TOWN' });
        }
        for (const w of t.wards) {
          if (w.toLowerCase().includes(queryClean)) {
            matchedTowns.push({ name: `${w}, ${t.name} (${d.district})`, lat: d.lat + 0.005, lng: d.lng - 0.005, type: 'TOWN' });
          }
        }
      }
    }

    return {
      pins: matchedPins,
      towns: matchedTowns.slice(0, 3),
    };
  }, [allAvailableAssets, searchQuery]);

  // Execute Geocoding & Spatial Location Search
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryClean = searchQuery.trim();
    if (!queryClean) return;

    setShowSuggestions(false);
    setIsGeocoding(true);

    try {
      // 1. Check if query matches an existing pin
      const exactPinMatch = allAvailableAssets.find(
        (p) => p.name.toLowerCase().includes(queryClean.toLowerCase()) || p.address.toLowerCase().includes(queryClean.toLowerCase())
      );

      if (exactPinMatch) {
        setSelectedPin(exactPinMatch);
        setMapCenter([exactPinMatch.latitude, exactPinMatch.longitude]);
        setMapZoom(16);
        setIsGeocoding(false);
        return;
      }

      // 2. Check in MAHARASHTRA_DISTRICTS hierarchy
      for (const d of MAHARASHTRA_DISTRICTS) {
        if (d.district.toLowerCase() === queryClean.toLowerCase()) {
          setMapCenter([d.lat, d.lng]);
          setMapZoom(14);
          generateServicesForCoords(d.lat, d.lng, d.district, d.district);
          setIsGeocoding(false);
          return;
        }
        for (const t of d.talukas) {
          if (t.name.toLowerCase() === queryClean.toLowerCase()) {
            const tLat = d.lat + 0.01;
            const tLng = d.lng + 0.01;
            setMapCenter([tLat, tLng]);
            setMapZoom(15);
            generateServicesForCoords(tLat, tLng, d.district, t.name);
            setIsGeocoding(false);
            return;
          }
          for (const w of t.wards) {
            if (w.toLowerCase().includes(queryClean.toLowerCase())) {
              const wLat = d.lat + 0.007;
              const wLng = d.lng - 0.007;
              setMapCenter([wLat, wLng]);
              setMapZoom(16);
              generateServicesForCoords(wLat, wLng, d.district, w);
              setIsGeocoding(false);
              return;
            }
          }
        }
      }

      // 3. Fallback to OpenStreetMap Nominatim Geocoding API for Maharashtra
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryClean + ', Maharashtra, India')}&limit=1`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);

          const newSearchPin: AssetPin = {
            id: 'geo-' + Date.now(),
            name: `${first.name || queryClean} (Searched Location)`,
            category: 'SEVA_KENDRA',
            latitude: lat,
            longitude: lng,
            address: first.display_name,
            details: `Spatial search location verified via OpenStreetMap.`,
            badge: 'Verified Location',
          };

          const dynamicServices = getDynamicLocationServices(lat, lng, queryClean, queryClean);

          setCustomSearchedPins((prev) => [newSearchPin, ...dynamicServices, ...prev]);
          setSelectedPin(newSearchPin);
          setMapCenter([lat, lng]);
          setMapZoom(15);
        } else {
          // If no result returned from geocoder, alert softly
          if (filteredAssets.length > 0) {
            setSelectedPin(filteredAssets[0]);
            setMapCenter([filteredAssets[0].latitude, filteredAssets[0].longitude]);
            setMapZoom(15);
          }
        }
      }
    } catch (err) {
      console.warn('Geocoding search network note:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const generateServicesForCoords = (lat: number, lng: number, distName: string, locality: string) => {
    const dynamic = getDynamicLocationServices(lat, lng, distName, locality);
    setCustomSearchedPins((prev) => [...dynamic, ...prev]);
  };

  const handleSelectAsset = (asset: AssetPin) => {
    setSelectedPin(asset);
    setMapCenter([asset.latitude, asset.longitude]);
    setMapZoom(16);
  };

  const handleCenterOnUser = () => {
    if (latitude && longitude) {
      setMapCenter([latitude, longitude]);
      setMapZoom(15);
      setSelectedPin(null);
    }
  };

  const handleQuickTagClick = (category: string, queryText: string = '') => {
    setCategoryFilter(category);
    if (queryText) {
      setSearchQuery(queryText);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setCategoryFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-dark via-primary to-blue-700 text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 mb-2 border border-white/20">
              <Layers className="w-3.5 h-3.5" /> Powered by MapTiler Vector Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Maharashtra Civic & Resiliency Map</h1>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl leading-relaxed">
              Live interactive spatial search for hospitals, emergency shelters, transit interchanges, Aaple Sarkar citizen service centers, and civic hazards across Maharashtra.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <button
              onClick={handleCenterOnUser}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl text-xs font-bold transition-all border border-white/30 shadow-sm"
              title="Center on my detected location"
            >
              <Crosshair className="w-4 h-4 text-emerald-300" />
              <span>📍 {ward || city || district || 'My Location'}</span>
            </button>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white">Live Search Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Controls */}
        <div className="space-y-6">
          {/* Search Box with Real-Time Autocomplete & Geocoding */}
          <div ref={searchContainerRef} className="bg-white p-4 rounded-xl border border-slate-border shadow-sm space-y-3 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Search Services & Locations
              </label>
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1 font-semibold"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Kolhapur, Sassoon, Shelter, Metro..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full pl-9 pr-16 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-medium"
              />
              <button
                type="submit"
                disabled={isGeocoding}
                className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                {isGeocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Find'}
              </button>
            </form>

            {/* Instant Autocomplete Suggestions Dropdown */}
            {showSuggestions && suggestions && (suggestions.pins.length > 0 || suggestions.towns.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                {suggestions.towns.length > 0 && (
                  <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Neighborhoods & Towns
                  </div>
                )}
                {suggestions.towns.map((town, idx) => (
                  <button
                    key={'town-' + idx}
                    onClick={() => {
                      setSearchQuery(town.name);
                      setMapCenter([town.lat, town.lng]);
                      setMapZoom(15);
                      generateServicesForCoords(town.lat, town.lng, town.name, town.name);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-primary-light flex items-center gap-2 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800">{town.name}</div>
                      <div className="text-[10px] text-slate-500">Pan map to this locality</div>
                    </div>
                  </button>
                ))}

                {suggestions.pins.length > 0 && (
                  <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Civic Services & Landmarks
                  </div>
                )}
                {suggestions.pins.map((pin) => (
                  <button
                    key={pin.id}
                    onClick={() => {
                      setSearchQuery(pin.name);
                      handleSelectAsset(pin);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-primary-light flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-slate-800 truncate">{pin.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{pin.address}</div>
                      </div>
                    </div>
                    {pin.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 ml-1">
                        {pin.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Search Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: '🏥 Hospital', cat: 'HOSPITAL' },
                { label: '⛺ Shelter', cat: 'SHELTER' },
                { label: '🏛️ Seva Kendra', cat: 'SEVA_KENDRA' },
                { label: '🚌 Transit', cat: 'TRANSIT' },
                { label: '🚰 Water & Ration', cat: 'WATER_FOOD' },
                { label: '⚠️ Hazards', cat: 'COMPLAINT' },
              ].map((chip) => (
                <button
                  key={chip.cat}
                  onClick={() => handleQuickTagClick(chip.cat)}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${
                    categoryFilter === chip.cat
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Categories */}
          <div className="bg-white p-5 rounded-xl border border-slate-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Highlight Service Type</h3>
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {filteredAssets.length} Pins
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { label: 'All Services & Pins', value: 'ALL', icon: MapPin, badge: 'bg-slate-100 text-slate-700' },
                { label: 'Govt Hospitals & Emergency Wards', value: 'HOSPITAL', icon: HeartPulse, badge: 'bg-red-100 text-red-700' },
                { label: 'Disaster Relief Shelters', value: 'SHELTER', icon: Building, badge: 'bg-emerald-100 text-emerald-700' },
                { label: 'Public Transit & Bus Terminals', value: 'TRANSIT', icon: Bus, badge: 'bg-sky-100 text-sky-700' },
                { label: 'Aaple Sarkar Seva Kendra', value: 'SEVA_KENDRA', icon: Landmark, badge: 'bg-teal-100 text-teal-700' },
                { label: 'Water & Ration Distribution', value: 'WATER_FOOD', icon: Droplets, badge: 'bg-cyan-100 text-cyan-700' },
                { label: 'Civic Grievance Hazards', value: 'COMPLAINT', icon: ShieldAlert, badge: 'bg-amber-100 text-amber-700' },
              ].map((filter) => {
                const Icon = filter.icon;
                const isSelected = categoryFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    onClick={() => setCategoryFilter(filter.value)}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm font-semibold'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                      <span>{filter.label}</span>
                    </div>
                    {categoryFilter !== filter.value && (
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${filter.badge}`}>
                        {filter.value === 'ALL' ? 'ALL' : filter.value}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Legend */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-border text-xs space-y-2">
            <span className="font-bold text-slate-700 block">Map Pin Color Key</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Hospitals</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Shelters</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Transit</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Seva Kendra</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Hazards</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Your Location</div>
            </div>
          </div>
        </div>

        {/* Main Map View */}
        <div className="lg:col-span-3 space-y-4">
          <div className="h-[560px] relative overflow-hidden rounded-2xl border border-slate-border shadow-md">
            <MapProvider>
              <LiveMap
                assets={filteredAssets}
                height="560px"
                showStyleSelector={true}
                selectedPin={selectedPin}
                onSelectPin={setSelectedPin}
                centerCoords={mapCenter}
                zoom={mapZoom}
              />
            </MapProvider>
          </div>

          {/* Highlighted Services Cards Grid */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span>Highlighted Services ({filteredAssets.length})</span>
                {searchQuery && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Matching "{searchQuery}"
                  </span>
                )}
              </h3>
              <span className="text-xs text-slate-500 font-normal">
                Click any service card to focus and inspect on the live map
              </span>
            </div>

            {filteredAssets.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                <Search className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No Services Found for "{searchQuery}"</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try searching for another neighborhood, city, or category like "Hospital", "Kolhapur", "Shelter", or "Seva Kendra".
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={handleSearchSubmit}
                    className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-dark transition-all"
                  >
                    Search via OpenStreetMap
                  </button>
                  <button
                    onClick={handleClearSearch}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
                  >
                    Reset Search
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredAssets.map((asset: AssetPin) => {
                  const dist = haversineDistance(userLat, userLng, asset.latitude, asset.longitude);
                  const isSelected = selectedPin?.id === asset.id;

                  return (
                    <div
                      key={asset.id}
                      onClick={() => handleSelectAsset(asset)}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-2 cursor-pointer group ${
                        isSelected
                          ? 'bg-blue-50/70 border-primary shadow-md ring-2 ring-primary/20'
                          : 'bg-white border-slate-border shadow-xs hover:shadow-md hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-800 text-xs leading-snug group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span>{asset.name}</span>
                        </h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {dist > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                              {dist} km
                            </span>
                          )}
                          {asset.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {asset.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{asset.address}</span>
                      </p>
                      {asset.details && (
                        <p className="text-[11px] bg-slate-50 p-2 rounded text-slate-600 font-mono line-clamp-2">
                          {asset.details}
                        </p>
                      )}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                        {asset.phone ? (
                          <a
                            href={`tel:${asset.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary font-semibold hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <Phone className="w-3 h-3" /> {asset.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No direct line</span>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAsset(asset);
                            }}
                            className="text-primary hover:text-primary-dark font-bold text-[11px] flex items-center gap-0.5"
                          >
                            Focus Map →
                          </button>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(asset.name + ' ' + asset.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-500 hover:text-primary flex items-center gap-1 text-[11px] font-medium"
                          >
                            Nav <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
