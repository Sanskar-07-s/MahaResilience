/**
 * emergencyService.ts — Location-aware emergency contacts and facilities service.
 */
import { LocationModel, haversineDistance } from './locationService.ts';

export interface EmergencyFacility {
  id: string;
  name: string;
  type: 'POLICE' | 'FIRE' | 'AMBULANCE' | 'SHELTER' | 'CONTROL_ROOM';
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export const getLocalEmergencyFacilities = (location: LocationModel): EmergencyFacility[] => {
  const district = location.district || 'Pune';
  const city = location.city || district;

  const raw: EmergencyFacility[] = [
    {
      id: 'e1',
      name: `${district} Police Commissionerate Control Room`,
      type: 'POLICE',
      phone: '112',
      address: `Police Lines, ${district}`,
      latitude: location.latitude + 0.008,
      longitude: location.longitude + 0.005,
    },
    {
      id: 'e2',
      name: `${city} Municipal Central Fire Station`,
      type: 'FIRE',
      phone: '101',
      address: `Station Road, ${city}, ${district}`,
      latitude: location.latitude - 0.011,
      longitude: location.longitude + 0.008,
    },
    {
      id: 'e3',
      name: `108 EMS Emergency Ambulance Response (${district})`,
      type: 'AMBULANCE',
      phone: '108',
      address: `State Ambulance Base Unit, ${district}`,
      latitude: location.latitude + 0.003,
      longitude: location.longitude - 0.006,
    },
    {
      id: 'e4',
      name: `${district} District Disaster Relief Shelter`,
      type: 'SHELTER',
      phone: '1916',
      address: `Community Complex, ${city}, ${district}`,
      latitude: location.latitude - 0.015,
      longitude: location.longitude - 0.012,
    },
  ];

  return raw
    .map((f) => ({
      ...f,
      distance: haversineDistance(location.latitude, location.longitude, f.latitude, f.longitude),
    }))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
};
