/**
 * environmentService.ts — Location-aware environment and sanitation service.
 */
import { LocationModel } from './locationService.ts';

export interface WasteInfo {
  district: string;
  city: string;
  wetWasteTime: string;
  dryWasteTime: string;
  nearestEwasteHub: string;
}

export const getLocalEnvironmentInfo = (location: LocationModel): WasteInfo => {
  const district = location.district || 'Pune';
  const city = location.city || district;

  return {
    district,
    city,
    wetWasteTime: '07:00 AM - 09:30 AM (Daily)',
    dryWasteTime: '08:00 AM - 11:00 AM (Mon, Wed, Fri)',
    nearestEwasteHub: `${district} Municipal Recycling Depot (1.8 km)`,
  };
};
