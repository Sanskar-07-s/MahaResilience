import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapWrapper, useMapSettings } from './MapProvider.tsx';
import { MapCard } from './MapCard.tsx';

export interface AssetPin {
  id: string;
  name: string;
  category: 'HOSPITAL' | 'SHELTER' | 'COMPLAINT' | 'TRANSIT' | 'TOURISM' | 'SEVA_KENDRA' | 'WATER_FOOD' | 'EMERGENCY';
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  details?: string;
  badge?: string;
}

export const createMapTilerIcon = (category: string, isUser = false) => {
  if (isUser) {
    return L.divIcon({
      className: 'maptiler-user-pin',
      html: `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 28px; height: 28px; background-color: rgba(59, 130, 246, 0.4); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 16px; height: 16px; background-color: #2563eb; border: 3px solid #ffffff; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  let color = '#3b82f6';
  let emoji = '📍';

  switch (category) {
    case 'HOSPITAL':
      color = '#ef4444';
      emoji = '🏥';
      break;
    case 'SHELTER':
      color = '#10b981';
      emoji = '⛺';
      break;
    case 'COMPLAINT':
      color = '#f59e0b';
      emoji = '⚠️';
      break;
    case 'TRANSIT':
      color = '#0284c7';
      emoji = '🚌';
      break;
    case 'TOURISM':
      color = '#8b5cf6';
      emoji = '🏰';
      break;
    case 'SEVA_KENDRA':
      color = '#0d9488';
      emoji = '🏛️';
      break;
    case 'WATER_FOOD':
      color = '#06b6d4';
      emoji = '🚰';
      break;
    case 'EMERGENCY':
      color = '#dc2626';
      emoji = '🚨';
      break;
    default:
      color = '#475569';
      emoji = '📍';
  }

  return L.divIcon({
    className: 'maptiler-service-pin',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
        <div style="background-color: ${color}; color: white; padding: 4px 6px; border-radius: 12px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.25); font-size: 13px; font-weight: bold; display: flex; align-items: center; justify-content: center; min-width: 28px; height: 28px;">
          ${emoji}
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid ${color}; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [32, 36],
    iconAnchor: [16, 36],
    popupAnchor: [0, -34],
  });
};

export const getDynamicLocationServices = (
  lat: number = 18.5204,
  lng: number = 73.8567,
  district: string = 'Pune',
  city: string = 'Pune'
): AssetPin[] => [
  {
    id: 'dyn-h1',
    name: `${district} General Civil Hospital & Emergency Unit`,
    category: 'HOSPITAL',
    latitude: lat + 0.005,
    longitude: lng + 0.007,
    address: `Civil Hospital Complex, ${city}, ${district}`,
    phone: '020-26120120',
    details: 'Free ICU Beds, 24x7 Emergency Unit, Oxygen & Blood Bank Unit',
    badge: '24x7 Emergency',
  },
  {
    id: 'dyn-s1',
    name: `${district} Disaster Relief Shelter & Safe Zone`,
    category: 'SHELTER',
    latitude: lat - 0.008,
    longitude: lng + 0.009,
    address: `Community Refuge Hall, ${city}, ${district}`,
    phone: '108',
    details: 'Equipped with food rations, clean drinking water & emergency power',
    badge: 'Active Shelter',
  },
  {
    id: 'dyn-sk1',
    name: `${district} Collectorate & Aaple Sarkar Seva Kendra`,
    category: 'SEVA_KENDRA',
    latitude: lat + 0.002,
    longitude: lng - 0.005,
    address: `Administrative Complex, ${district}`,
    phone: '1800-120-8040',
    details: 'Citizen Services: 7/12 land records, caste certificate, income proof',
    badge: 'Govt Services',
  },
  {
    id: 'dyn-t1',
    name: `${city} Central MSRTC Bus Depot & Transit Junction`,
    category: 'TRANSIT',
    latitude: lat - 0.004,
    longitude: lng - 0.006,
    address: `Bus Stand Road, ${city}`,
    phone: '1912',
    details: 'MSRTC Bus Depot & Local Commuter Interchange',
    badge: 'Public Transit',
  },
  {
    id: 'dyn-c1',
    name: `${city} Main Road Drainage Hazard`,
    category: 'COMPLAINT',
    latitude: lat + 0.009,
    longitude: lng - 0.003,
    address: `Main Chowk, ${city}`,
    details: 'Civic Complaint Logged via Citizen Portal. Municipal Crew Assigned.',
    badge: 'In Progress',
  },
];

export const MAHARASHTRA_DEFAULT_SERVICES: AssetPin[] = [
  // Pune Services
  { id: 'h1', name: 'Pune General Civil Hospital (Sassoon)', category: 'HOSPITAL', latitude: 18.5244, longitude: 73.8527, address: 'Near Pune Railway Station, Shivajinagar, Pune', phone: '020-26120120', details: 'Free Emergency ICU, Trauma Center & Blood Bank (54 Beds Free)', badge: '24x7 Emergency' },
  { id: 's1', name: 'Pune West Disaster Relief Shelter', category: 'SHELTER', latitude: 18.5144, longitude: 73.8627, address: 'Erandwane Relief Complex, Karve Road, Pune', phone: '108', details: 'Capacity: 500 people. Clean drinking water, medical staff & food packets', badge: 'Active Shelter' },
  { id: 'c1', name: 'Western Bypass Pothole Hazard', category: 'COMPLAINT', latitude: 18.5304, longitude: 73.8597, address: 'Baner-Pashan Link Road, Pune', details: 'Civic Hazard reported via Citizen Portal. PWD Dispatch assigned.', badge: 'Grievance Pending' },
  { id: 't1', name: 'Shivajinagar Central Bus Depot & Metro Hub', category: 'TRANSIT', latitude: 18.5284, longitude: 73.8497, address: 'Shivajinagar, Pune', phone: '020-25536970', details: 'MSRTC Bus Services & Metro Line 1 Interchange Station', badge: 'Public Transit' },
  { id: 'sk1', name: 'Aaple Sarkar Citizen Facilitation Center (Seva Kendra)', category: 'SEVA_KENDRA', latitude: 18.5204, longitude: 73.8567, address: 'Collector Office Campus, Pune', phone: '1800-120-8040', details: 'Aadhaar, Caste Certificate, Land Records (7/12), Ration Card Services', badge: 'Govt Services' },

  // Mumbai Services
  { id: 'h2', name: 'KEM Hospital & Research Center', category: 'HOSPITAL', latitude: 19.0024, longitude: 72.8427, address: 'Acharya Donde Marg, Parel, Mumbai', phone: '022-24107000', details: 'Level 1 Trauma Emergency Center, Cardiology & Burn Ward (88 ICU Beds Available)', badge: '24x7 Emergency' },
  { id: 's2', name: 'Dadar Flood Emergency Relief Camp', category: 'SHELTER', latitude: 19.0178, longitude: 72.8478, address: 'Dadar Community Hall, Mumbai', phone: '1916', details: 'High-tide shelter point. Emergency ration, power backup & medical kits', badge: 'Disaster Shelter' },
  { id: 't2', name: 'CSMT Central Railway & Bus Terminal', category: 'TRANSIT', latitude: 18.9400, longitude: 72.8353, address: 'Fort, Mumbai', phone: '139', details: 'Central Railway & BEST Bus Connectivity Hub', badge: 'Transport Hub' },
  { id: 'tm1', name: 'Gateway of India Heritage Site', category: 'TOURISM', latitude: 18.9220, longitude: 72.8347, address: 'Apollo Bandar, Colaba, Mumbai', details: 'Historical Landmark & Ferry Connectivity to Elephanta Caves', badge: 'Heritage Site' },
  { id: 'wf1', name: 'Mumbai Disaster Response Ration Depot', category: 'WATER_FOOD', latitude: 19.0330, longitude: 72.8550, address: 'Kurla West Municipal Godown, Mumbai', phone: '022-26500000', details: 'Emergency Drinking Water & Dry Ration Distribution Point', badge: 'Relief Depot' },

  // Nagpur Services
  { id: 'h3', name: 'Nagpur Government Medical College (GMC)', category: 'HOSPITAL', latitude: 21.1350, longitude: 79.0880, address: 'Hanuman Nagar, Nagpur', phone: '0712-2740300', details: 'Heatwave Special Medical Ward, Burn Unit & ICU', badge: '24x7 Regional Hospital' },
  { id: 't3', name: 'Sitabuldi Interchange Metro Station', category: 'TRANSIT', latitude: 21.1458, longitude: 79.0882, address: 'Sitabuldi, Nagpur', phone: '0712-2554444', details: 'Nagpur Metro Rail Transit Hub', badge: 'Metro Transit' },

  // Nashik Services
  { id: 's3', name: 'Nashik District Disaster Shelter Camp', category: 'SHELTER', latitude: 19.9975, longitude: 73.7898, address: 'Panchavati, Nashik', phone: '0253-2571212', details: 'Godavari Flood Safety Center with emergency boat services', badge: 'Flood Safety' },
];

interface MapProps {
  assets?: AssetPin[];
  height?: string;
  showStyleSelector?: boolean;
}

import { useLocation } from '../../contexts/LocationContext.tsx';

export const LiveMap: React.FC<MapProps> = ({ assets = [], height = '480px', showStyleSelector = true }) => {
  const { coords } = useMapSettings();
  const { latitude, longitude, district, city } = useLocation();
  const [selected, setSelected] = useState<AssetPin | null>(null);

  const userLat = latitude || coords?.lat || 18.5204;
  const userLng = longitude || coords?.lng || 73.8567;

  const dynamicFallback = getDynamicLocationServices(userLat, userLng, district, city);

  const pins: AssetPin[] = assets.length > 0 ? assets : [...dynamicFallback, ...MAHARASHTRA_DEFAULT_SERVICES];

  return (
    <div className="relative w-full">
      <MapWrapper height={height} showStyleSelector={showStyleSelector}>
        {/* Render current user position with animated pulsing ring */}
        {coords && (
          <Marker
            position={[coords.lat, coords.lng]}
            icon={createMapTilerIcon('USER', true)}
          >
            <Popup className="custom-popup">
              <div className="p-1 font-semibold text-xs text-blue-700">
                📍 You are here (Current Location)
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render interactive service pins */}
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={createMapTilerIcon(pin.category)}
            eventHandlers={{
              click: () => setSelected(pin)
            }}
          >
            <Popup>
              <div className="p-1 text-xs">
                <div className="font-bold text-slate-800">{pin.name}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">{pin.address}</div>
                {pin.badge && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-primary/10 text-primary font-bold rounded text-[10px]">
                    {pin.badge}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapWrapper>

      {/* Selected Marker Details Overlay Card */}
      {selected && (
        <MapCard
          title={selected.name}
          address={selected.address}
          phone={selected.phone}
          details={selected.details}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export const EmergencyMap: React.FC<MapProps> = ({ assets = [], height, showStyleSelector }) => {
  const emergencyPins = assets.filter(a => a.category === 'HOSPITAL' || a.category === 'SHELTER' || a.category === 'EMERGENCY' || a.category === 'WATER_FOOD');
  return <LiveMap assets={emergencyPins.length > 0 ? emergencyPins : MAHARASHTRA_DEFAULT_SERVICES.filter(a => a.category === 'HOSPITAL' || a.category === 'SHELTER' || a.category === 'WATER_FOOD')} height={height} showStyleSelector={showStyleSelector} />;
};

export const ComplaintMap: React.FC<MapProps> = ({ assets = [], height, showStyleSelector }) => {
  const complaintPins = assets.filter(a => a.category === 'COMPLAINT');
  return <LiveMap assets={complaintPins.length > 0 ? complaintPins : MAHARASHTRA_DEFAULT_SERVICES.filter(a => a.category === 'COMPLAINT')} height={height} showStyleSelector={showStyleSelector} />;
};

export const HospitalMap: React.FC<MapProps> = ({ assets = [], height, showStyleSelector }) => {
  const hospitalPins = assets.filter(a => a.category === 'HOSPITAL');
  return <LiveMap assets={hospitalPins.length > 0 ? hospitalPins : MAHARASHTRA_DEFAULT_SERVICES.filter(a => a.category === 'HOSPITAL')} height={height} showStyleSelector={showStyleSelector} />;
};

export const ShelterMap: React.FC<MapProps> = ({ assets = [], height, showStyleSelector }) => {
  const shelterPins = assets.filter(a => a.category === 'SHELTER');
  return <LiveMap assets={shelterPins.length > 0 ? shelterPins : MAHARASHTRA_DEFAULT_SERVICES.filter(a => a.category === 'SHELTER')} height={height} showStyleSelector={showStyleSelector} />;
};

export const TourismMap: React.FC<MapProps> = ({ assets = [], height, showStyleSelector }) => {
  const tourismPins = assets.filter(a => a.category === 'TOURISM');
  return <LiveMap assets={tourismPins.length > 0 ? tourismPins : MAHARASHTRA_DEFAULT_SERVICES.filter(a => a.category === 'TOURISM')} height={height} showStyleSelector={showStyleSelector} />;
};

