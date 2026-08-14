/**
 * governmentService.ts — Location-aware government services query layer.
 */
import { LocationModel } from './locationService.ts';

export interface GovtOffice {
  id: string;
  name: string;
  type: string;
  district: string;
  address: string;
  contact: string;
  latitude: number;
  longitude: number;
}

export const getLocalGovtOffices = (location: LocationModel): GovtOffice[] => {
  const district = location.district || 'Pune';
  const city = location.city || district;

  return [
    {
      id: 'g1',
      name: `${district} District Collectorate & Citizen Facilitation Center`,
      type: 'COLLECTORATE',
      district,
      address: `Collectorate Campus, Station Road, ${district}`,
      contact: '020-26123456',
      latitude: location.latitude + 0.01,
      longitude: location.longitude + 0.01,
    },
    {
      id: 'g2',
      name: `${city} Tehsildar & Revenue Office`,
      type: 'TEHSIL',
      district,
      address: `Administrative Building, ${city}, ${district}`,
      contact: '020-26127890',
      latitude: location.latitude - 0.012,
      longitude: location.longitude - 0.008,
    },
    {
      id: 'g3',
      name: `Aaple Sarkar Seva Kendra (${city} West)`,
      type: 'SEVA_KENDRA',
      district,
      address: `Municipal Building, ${city}`,
      contact: '1800-120-8040',
      latitude: location.latitude + 0.005,
      longitude: location.longitude - 0.005,
    },
  ];
};
