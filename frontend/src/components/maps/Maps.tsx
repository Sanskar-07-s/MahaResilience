import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { MapWrapper, useMapSettings } from './MapProvider.tsx';
import { MapCard } from './MapCard.tsx';

interface AssetPin {
  id: string;
  name: string;
  category: 'HOSPITAL' | 'SHELTER' | 'COMPLAINT' | 'TRANSIT' | 'TOURISM';
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  details?: string;
}

interface MapProps {
  assets?: AssetPin[];
  height?: string;
}

export const LiveMap: React.FC<MapProps> = ({ assets = [], height = '450px' }) => {
  const { coords } = useMapSettings();
  const [selected, setSelected] = useState<AssetPin | null>(null);

  // Fallback defaults if list is empty
  const pins: AssetPin[] = assets.length > 0 ? assets : [
    { id: 'h1', name: 'Pune General Civil Hospital', category: 'HOSPITAL', latitude: 18.5244, longitude: 73.8527, address: 'Shivajinagar, Pune', phone: '020-26120120', details: 'ICU Beds: 12 Free' },
    { id: 's1', name: 'Pune West Flood Shelter', category: 'SHELTER', latitude: 18.5144, longitude: 73.8627, address: 'Erandwane, Pune', phone: '108', details: 'Capacity: 500' },
    { id: 'c1', name: 'Western Highway Pothole Hazard', category: 'COMPLAINT', latitude: 18.5304, longitude: 73.8597, address: 'Bandra West, Mumbai', details: 'Status: PENDING' },
    { id: 't1', name: 'Versova Transit Terminal', category: 'TRANSIT', latitude: 18.5284, longitude: 73.8497, address: 'Versova Metro Line 1', details: 'Metro services active' },
    { id: 'tm1', name: 'Gateway of India', category: 'TOURISM', latitude: 18.9220, longitude: 72.8347, address: 'Apollo Bandar, Mumbai', details: 'Heritage landmark' }
  ];

  return (
    <div className="relative">
      <MapWrapper height={height}>
        {/* Render current user position */}
        {coords && (
          <Marker position={[coords.lat, coords.lng]}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* Render pins */}
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            eventHandlers={{
              click: () => setSelected(pin)
            }}
          />
        ))}
      </MapWrapper>

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

export const EmergencyMap: React.FC<MapProps> = ({ assets = [], height }) => {
  const emergencyPins = assets.filter(a => a.category === 'HOSPITAL' || a.category === 'SHELTER');
  return <LiveMap assets={emergencyPins.length > 0 ? emergencyPins : undefined} height={height} />;
};

export const ComplaintMap: React.FC<MapProps> = ({ assets = [], height }) => {
  const complaintPins = assets.filter(a => a.category === 'COMPLAINT');
  return <LiveMap assets={complaintPins.length > 0 ? complaintPins : undefined} height={height} />;
};

export const HospitalMap: React.FC<MapProps> = ({ assets = [], height }) => {
  const hospitalPins = assets.filter(a => a.category === 'HOSPITAL');
  return <LiveMap assets={hospitalPins.length > 0 ? hospitalPins : undefined} height={height} />;
};

export const ShelterMap: React.FC<MapProps> = ({ assets = [], height }) => {
  const shelterPins = assets.filter(a => a.category === 'SHELTER');
  return <LiveMap assets={shelterPins.length > 0 ? shelterPins : undefined} height={height} />;
};

export const TourismMap: React.FC<MapProps> = ({ assets = [], height }) => {
  const tourismPins = assets.filter(a => a.category === 'TOURISM');
  return <LiveMap assets={tourismPins.length > 0 ? tourismPins : undefined} height={height} />;
};
