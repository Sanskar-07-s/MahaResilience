import React, { useState } from 'react';
import { MapPin, Building, HeartPulse, ShieldAlert, Bus, Search, Landmark, Droplets, Layers, ExternalLink } from 'lucide-react';
import { MapProvider } from '../../components/maps/MapProvider.tsx';
import { LiveMap, MAHARASHTRA_DEFAULT_SERVICES, AssetPin } from '../../components/maps/Maps.tsx';

const MapPage: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAssets = MAHARASHTRA_DEFAULT_SERVICES.filter((asset) => {
    const matchesCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;
    const matchesSearch = searchQuery === '' ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.details && asset.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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
              Real-time interactive spatial mapping of government hospitals, emergency shelters, transport interchanges, Aaple Sarkar citizen service centers, and reported civic hazards across Maharashtra districts.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">Live MapTiler API Key Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Controls */}
        <div className="space-y-6">
          {/* Search Box */}
          <div className="bg-white p-4 rounded-xl border border-slate-border shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Search Services & Locations</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Pune, Sassoon, Shelter, Metro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
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
                { label: 'Public Transit & Metro Hubs', value: 'TRANSIT', icon: Bus, badge: 'bg-sky-100 text-sky-700' },
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
              <LiveMap assets={filteredAssets} height="560px" showStyleSelector={true} />
            </MapProvider>
          </div>

          {/* Highlighted Services Cards Grid */}
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center justify-between">
              <span>Highlighted Services ({filteredAssets.length})</span>
              <span className="text-xs text-slate-500 font-normal">Click any pin or card to inspect details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAssets.map((asset: AssetPin) => (
                <div
                  key={asset.id}
                  className="bg-white p-4 rounded-xl border border-slate-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-800 text-xs leading-snug group-hover:text-primary transition-colors">
                      {asset.name}
                    </h4>
                    {asset.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                        {asset.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{asset.address}</p>
                  {asset.details && (
                    <p className="text-[11px] bg-slate-50 p-2 rounded text-slate-600 font-mono line-clamp-2">
                      {asset.details}
                    </p>
                  )}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                    {asset.phone ? (
                      <a href={`tel:${asset.phone}`} className="text-primary font-semibold hover:underline flex items-center gap-1 text-[11px]">
                        📞 {asset.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No direct line</span>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(asset.name + ' ' + asset.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-primary flex items-center gap-1 text-[11px] font-medium"
                    >
                      Navigation <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;

