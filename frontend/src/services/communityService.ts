/**
 * communityService.ts — Location-aware community resources service.
 */
import { LocationModel } from './locationService.ts';

export interface CommunityResource {
  id: string;
  name: string;
  type: string;
  contact: string;
  address: string;
}

export const getLocalCommunityResources = (location: LocationModel): CommunityResource[] => {
  const district = location.district || 'Pune';
  const city = location.city || district;

  return [
    {
      id: 'c1',
      name: `${city} Citizen Volunteer & Relief Squad`,
      type: 'VOLUNTEER_GROUP',
      contact: '9876543210',
      address: `Community Center, ${city}`,
    },
    {
      id: 'c2',
      name: `${district} NGO Alliance for Disaster Assistance`,
      type: 'NGO',
      contact: '020-25551234',
      address: `Civic Office Sector, ${district}`,
    },
  ];
};
