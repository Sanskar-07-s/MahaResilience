/**
 * tourismService.ts — Location-aware tourism service.
 */
import { LocationModel, haversineDistance } from './locationService.ts';

export interface TouristAttraction {
  id: string;
  name: string;
  category: 'FORT' | 'NATURE' | 'TEMPLE' | 'HERITAGE';
  description: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export const getLocalAttractions = (location: LocationModel): TouristAttraction[] => {
  const district = location.district || 'Pune';

  const raw: TouristAttraction[] = [
    {
      id: 't1',
      name: `${district} Historic Heritage Fort`,
      category: 'FORT',
      description: 'Historical hill fort with trekking trails and scenic views.',
      latitude: location.latitude + 0.03,
      longitude: location.longitude + 0.04,
    },
    {
      id: 't2',
      name: `${district} Central Botanical Nature Sanctuary`,
      category: 'NATURE',
      description: 'Protected forest reserve with rich flora and monsoon streams.',
      latitude: location.latitude - 0.025,
      longitude: location.longitude + 0.02,
    },
  ];

  return raw
    .map((a) => ({
      ...a,
      distance: haversineDistance(location.latitude, location.longitude, a.latitude, a.longitude),
    }))
    .sort((x, y) => (x.distance || 0) - (y.distance || 0));
};
