/**
 * healthcareService.ts — Location-aware healthcare service.
 */
import { LocationModel, haversineDistance } from './locationService.ts';

export interface HealthcareFacility {
  id: string;
  name: string;
  type: 'GOVERNMENT' | 'PHC' | 'PRIVATE' | 'BLOOD_BANK';
  phone: string;
  address: string;
  availableBeds: number;
  hasEmergencyUnit: boolean;
  latitude: number;
  longitude: number;
  distance?: number;
}

export const getLocalHealthcareFacilities = (location: LocationModel): HealthcareFacility[] => {
  const district = location.district || 'Pune';
  const city = location.city || district;

  const raw: HealthcareFacility[] = [
    {
      id: 'h1',
      name: `${district} General Civil Hospital`,
      type: 'GOVERNMENT',
      phone: '020-26120120',
      address: `Civil Hospital Road, ${district}`,
      availableBeds: 48,
      hasEmergencyUnit: true,
      latitude: location.latitude + 0.005,
      longitude: location.longitude + 0.007,
    },
    {
      id: 'h2',
      name: `${city} Primary Health Center (PHC)`,
      type: 'PHC',
      phone: '108',
      address: `Health Post, ${city}, ${district}`,
      availableBeds: 12,
      hasEmergencyUnit: false,
      latitude: location.latitude - 0.007,
      longitude: location.longitude + 0.004,
    },
    {
      id: 'h3',
      name: `${district} Red Cross Blood Bank`,
      type: 'BLOOD_BANK',
      phone: '020-26500000',
      address: `Station Road, ${district}`,
      availableBeds: 0,
      hasEmergencyUnit: false,
      latitude: location.latitude + 0.015,
      longitude: location.longitude - 0.01,
    },
  ];

  return raw
    .map((h) => ({
      ...h,
      distance: haversineDistance(location.latitude, location.longitude, h.latitude, h.longitude),
    }))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
};
