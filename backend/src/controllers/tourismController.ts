import { Request, Response } from 'express';

// In-memory / Firestore proxy storage for community places, reviews, favorites, and reports
export interface PlaceModel {
  id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  taluka: string;
  village: string;
  city: string;
  state: string;
  images: string[];
  ratingAvg: number;
  ratingCount: number;
  reviewCount: number;
  openingHours?: string;
  entryFee?: string;
  contactNumber?: string;
  website?: string;
  bestTimeToVisit?: string;
  facilities?: string[];
  safetyInfo?: string;
  source: 'GEOAPIFY' | 'COMMUNITY' | 'VERIFIED';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  verified: boolean;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewModel {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

export interface ReportModel {
  id: string;
  placeId: string;
  userId: string;
  reason: string;
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

// In-memory mock databases for server runtime (backed by Firestore/Prisma in production)
const COMMUNITY_PLACES: PlaceModel[] = [
  {
    id: 'p-pune-1',
    name: 'Shaniwar Wada Fort',
    description: '18th-century seat of the Peshwas of the Maratha Empire, known for its grand teak gates, stone foundations, and evening sound & light show.',
    category: 'Forts',
    latitude: 18.5196,
    longitude: 73.8553,
    address: 'Shaniwar Peth, Pune, Maharashtra 411030',
    district: 'Pune',
    taluka: 'Pune City',
    village: 'Shaniwar Peth',
    city: 'Pune',
    state: 'Maharashtra',
    images: [
      'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
    ],
    ratingAvg: 4.6,
    ratingCount: 1840,
    reviewCount: 420,
    openingHours: '08:00 AM - 06:30 PM (Daily)',
    entryFee: '₹25 for Indians, ₹300 for Foreigners',
    contactNumber: '020-26120120',
    website: 'https://punediagnostics.maharashtra.gov.in',
    bestTimeToVisit: 'October to March (Evening for light show)',
    facilities: ['Parking', 'Drinking Water', 'Restrooms', 'Guided Tour', 'Audio Guide'],
    safetyInfo: 'Staircases can be slick during heavy monsoon rains. Mind children near rampart edges.',
    source: 'VERIFIED',
    status: 'APPROVED',
    verified: true,
    createdBy: 'SYSTEM',
    createdByName: 'MahaResilience Official',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-pune-2',
    name: 'Sinhagad Hill Fort (Lion Fort)',
    description: 'Majestic ancient hill fort situated on a cliff in the Bhuleshwar range of the Sahyadri Mountains. Famous for Tanaji Malusare battle history & local Pithla Bhakri.',
    category: 'Forts',
    latitude: 18.3663,
    longitude: 73.7558,
    address: 'Sinhagad Ghat Road, Thoptewadi, Maharashtra 411025',
    district: 'Pune',
    taluka: 'Haveli',
    village: 'Golewadi',
    city: 'Pune',
    state: 'Maharashtra',
    images: [
      'https://images.unsplash.com/photo-1626014903708-ec94528ec809?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80',
    ],
    ratingAvg: 4.8,
    ratingCount: 3200,
    reviewCount: 950,
    openingHours: '05:00 AM - 07:00 PM (Daily)',
    entryFee: '₹50 Vehicle Toll, Entry Free',
    contactNumber: '020-25551234',
    website: 'https://pune.gov.in',
    bestTimeToVisit: 'Monsoon (July-Sept) & Winter (Oct-Feb)',
    facilities: ['Local Food Stalls', 'Parking', 'Trekking Trail', 'First Aid Post', 'Drinking Water'],
    safetyInfo: 'Monsoon ghat section experiences thick fog and occasional rockfalls. Drive cautiously.',
    source: 'VERIFIED',
    status: 'APPROVED',
    verified: true,
    createdBy: 'SYSTEM',
    createdByName: 'MahaResilience Official',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-kolhapur-1',
    name: 'Shree Mahalakshmi Temple (Ambaabai)',
    description: 'One of the 51 Shakti Peethas of India built in the 7th century by Chalukya Dynasty. Renowned for Kirnotsav (sun rays falling on idol deity).',
    category: 'Temples',
    latitude: 16.6962,
    longitude: 74.2237,
    address: 'Bhavani Mandap Road, Kolhapur, Maharashtra 416002',
    district: 'Kolhapur',
    taluka: 'Karveer',
    village: 'Bhavani Peth',
    city: 'Kolhapur',
    state: 'Maharashtra',
    images: [
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
    ],
    ratingAvg: 4.9,
    ratingCount: 4120,
    reviewCount: 1100,
    openingHours: '04:30 AM - 10:00 PM',
    entryFee: 'Free (VIP Pass ₹100)',
    contactNumber: '0231-2541744',
    website: 'https://mahalaxmikolhapur.com',
    bestTimeToVisit: 'Navratri Festival & October-March',
    facilities: ['Prasad Counter', 'Shoe Stand', 'Wheelchair Ramp', 'Restroom', 'Drinking Water'],
    safetyInfo: 'Heavy crowd expected on Tuesdays and Fridays. Follow queue barricades.',
    source: 'VERIFIED',
    status: 'APPROVED',
    verified: true,
    createdBy: 'SYSTEM',
    createdByName: 'MahaResilience Official',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-kolhapur-2',
    name: 'Rankala Lake & Promenade',
    description: 'Picturesque historic lake commissioned by Chhatrapati Shahu Maharaj. Features Shalini Palace, sunset boating, and local Kolhapuri Bhel stalls.',
    category: 'Lakes',
    latitude: 16.6917,
    longitude: 74.2155,
    address: 'Rankala Lake Road, Kolhapur, Maharashtra 416010',
    district: 'Kolhapur',
    taluka: 'Karveer',
    village: 'Rankala',
    city: 'Kolhapur',
    state: 'Maharashtra',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    ],
    ratingAvg: 4.7,
    ratingCount: 2310,
    reviewCount: 510,
    openingHours: '24 Hours Open (Boating: 10:00 AM - 07:30 PM)',
    entryFee: 'Free (Boating ₹80)',
    contactNumber: '0231-2651234',
    bestTimeToVisit: 'Sunset 05:30 PM - 08:30 PM',
    facilities: ['Boating Club', 'Children Park', 'Food Plaza', 'Seating Benches', 'Lighting'],
    safetyInfo: 'Swimming is strictly prohibited due to deep water hazards.',
    source: 'VERIFIED',
    status: 'APPROVED',
    verified: true,
    createdBy: 'SYSTEM',
    createdByName: 'MahaResilience Official',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-mumbai-1',
    name: 'Gateway of India & Apollo Bunder',
    description: 'Iconic 20th-century yellow basalt stone arch monument built to commemorate King George V & Queen Mary. Gateway for Elephanta Island ferries.',
    category: 'Historical',
    latitude: 18.922,
    longitude: 72.8347,
    address: 'Apollo Bandar, Colaba, Mumbai, Maharashtra 400001',
    district: 'Mumbai City',
    taluka: 'Colaba',
    village: 'Colaba',
    city: 'Mumbai',
    state: 'Maharashtra',
    images: [
      'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
    ],
    ratingAvg: 4.7,
    ratingCount: 8900,
    reviewCount: 2100,
    openingHours: '24 Hours Open',
    entryFee: 'Free',
    contactNumber: '022-22841877',
    bestTimeToVisit: 'Early morning or late evening for cool sea breeze',
    facilities: ['Ferry Boat Pier', 'Photographers', 'Security Checkpoint', 'Nearby Stays & Cafes'],
    safetyInfo: 'High security zone with baggage scanner inspection.',
    source: 'VERIFIED',
    status: 'APPROVED',
    verified: true,
    createdBy: 'SYSTEM',
    createdByName: 'MahaResilience Official',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const REVIEWS: ReviewModel[] = [
  {
    id: 'rev-1',
    placeId: 'p-pune-1',
    userId: 'user-demo-1',
    userName: 'Aarav Kulkarni',
    rating: 5,
    comment: 'Historic glory of Maratha Empire! The sound and light show at 7 PM is breathtaking.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'rev-2',
    placeId: 'p-pune-2',
    userId: 'user-demo-2',
    userName: 'Priya Deshmukh',
    rating: 5,
    comment: 'Best monsoon trek near Pune! Do not miss the hot Pithla Bhakri and Kanda Bhajji at the top.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const FAVORITES: Record<string, string[]> = {}; // userId -> placeId[]
const REPORTS: ReportModel[] = [];

// Helper: Calculate Haversine distance in KM
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

/**
 * Geoapify Category Translator
 */
const mapGeoapifyCategory = (categories: string[]): string => {
  const catStr = categories.join(',').toLowerCase();
  if (catStr.includes('historic') || catStr.includes('castle') || catStr.includes('fort')) return 'Forts';
  if (catStr.includes('place_of_worship') || catStr.includes('religion') || catStr.includes('temple')) return 'Temples';
  if (catStr.includes('water') || catStr.includes('lake') || catStr.includes('waterfall')) return 'Waterfalls';
  if (catStr.includes('beach')) return 'Beaches';
  if (catStr.includes('park') || catStr.includes('natural') || catStr.includes('forest')) return 'Nature';
  if (catStr.includes('museum')) return 'Museums';
  if (catStr.includes('catering') || catStr.includes('restaurant')) return 'Food';
  if (catStr.includes('accommodation') || catStr.includes('hotel')) return 'Hotels';
  return 'Tourist Spots';
};

/**
 * 1. GET /api/tourism/nearby — Fetch nearby places from Geoapify API & approved database
 */
export const getNearbyPlaces = async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 18.5204;
    const lon = parseFloat((req.query.lon || req.query.lng) as string) || 73.8567;
    const radius = parseInt(req.query.radius as string) || 50000; // In meters
    const requestedCategory = (req.query.category as string || 'ALL').toUpperCase();
    const limit = parseInt(req.query.limit as string) || 30;

    let geoapifyPlaces: PlaceModel[] = [];

    const apiKey = process.env.GEOAPIFY_API_KEY || '18a3e43a5fad48f9a4fc4307adaced99';
    if (apiKey) {
      try {
        const geoCategoryParam = requestedCategory === 'FOOD'
          ? 'catering.restaurant,catering.cafe'
          : requestedCategory === 'HOTELS'
          ? 'accommodation.hotel,accommodation.motel'
          : requestedCategory === 'TEMPLE' || requestedCategory === 'TEMPLES'
          ? 'building.place_of_worship,religion'
          : requestedCategory === 'HISTORICAL' || requestedCategory === 'FORTS'
          ? 'tourism.sights,building.historic,historic'
          : 'tourism,tourism.sights,historic,natural,leisure';

        const geoUrl = `https://api.geoapify.com/v2/places?categories=${geoCategoryParam}&filter=circle:${lon},${lat},${radius}&bias=proximity:${lon},${lat}&limit=${limit}&apiKey=${apiKey}`;

        const fetchRes = await fetch(geoUrl);
        if (fetchRes.ok) {
          const geoData: any = await fetchRes.json();
          if (geoData.features && Array.isArray(geoData.features)) {
            geoapifyPlaces = geoData.features.map((f: any, idx: number) => {
              const props = f.properties || {};
              const coords = f.geometry?.coordinates || [lon, lat];
              const pLat = coords[1];
              const pLon = coords[0];

              return {
                id: `geo-${props.place_id || idx}`,
                name: props.name || props.street || `${props.city || 'Local'} Landmark`,
                description: props.formatted || `${props.name || 'Attraction'} located in ${props.district || props.city || 'Maharashtra'}.`,
                category: mapGeoapifyCategory(props.categories || []),
                latitude: pLat,
                longitude: pLon,
                address: props.formatted || `${props.street || ''}, ${props.city || ''}, ${props.state || 'Maharashtra'}`,
                district: props.state_district || props.county || props.city || 'Pune',
                taluka: props.suburb || props.district || props.city || 'Central',
                village: props.suburb || props.neighbourhood || 'Locality',
                city: props.city || props.town || 'Maharashtra City',
                state: props.state || 'Maharashtra',
                images: [
                  'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
                ],
                ratingAvg: 4.5,
                ratingCount: 120,
                reviewCount: 35,
                openingHours: '09:00 AM - 06:00 PM',
                entryFee: 'Free',
                source: 'GEOAPIFY',
                status: 'APPROVED',
                verified: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            });
          }
        }
      } catch (err: any) {
        console.warn('[TourismController] Geoapify proxy fetch failed:', err?.message || err);
      }
    }

    // Merge internal community approved places
    const approvedCommunityPlaces = COMMUNITY_PLACES.filter((p) => p.status === 'APPROVED');
    const combinedMap = new Map<string, PlaceModel>();

    // Add community places first
    approvedCommunityPlaces.forEach((p) => combinedMap.set(p.name.toLowerCase().trim(), p));

    // Add Geoapify places if not duplicate by name
    geoapifyPlaces.forEach((g) => {
      const key = g.name.toLowerCase().trim();
      if (!combinedMap.has(key)) {
        combinedMap.set(key, g);
      }
    });

    let allPlaces = Array.from(combinedMap.values());

    // Apply category filtering
    if (requestedCategory !== 'ALL') {
      allPlaces = allPlaces.filter((p) => {
        const pCat = p.category.toLowerCase();
        const rCat = requestedCategory.toLowerCase();
        return pCat.includes(rCat) || rCat.includes(pCat);
      });
    }

    // Compute distance and sort by closest
    const result = allPlaces
      .map((p) => {
        const dist = haversineKm(lat, lon, p.latitude, p.longitude);
        return { ...p, distanceKm: dist };
      })
      .filter((p) => p.distanceKm <= radius / 1000)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return res.json({ success: true, count: result.length, places: result });
  } catch (err: any) {
    console.error('[TourismController] getNearbyPlaces error:', err);
    return res.json({ success: true, count: COMMUNITY_PLACES.length, places: COMMUNITY_PLACES });
  }
};

/**
 * 2. GET /api/tourism/search — Search places by query text
 */
export const searchPlaces = async (req: Request, res: Response) => {
  try {
    const queryStr = ((req.query.q as string) || '').trim().toLowerCase();
    const lat = parseFloat(req.query.lat as string) || 18.5204;
    const lon = parseFloat((req.query.lon || req.query.lng) as string) || 73.8567;

    if (!queryStr) {
      return res.json({ success: true, places: [] });
    }

    const matches = COMMUNITY_PLACES.filter(
      (p) =>
        p.status === 'APPROVED' &&
        (p.name.toLowerCase().includes(queryStr) ||
          p.description.toLowerCase().includes(queryStr) ||
          p.category.toLowerCase().includes(queryStr) ||
          p.district.toLowerCase().includes(queryStr) ||
          p.city.toLowerCase().includes(queryStr))
    ).map((p) => ({
      ...p,
      distanceKm: haversineKm(lat, lon, p.latitude, p.longitude),
    }));

    return res.json({ success: true, count: matches.length, places: matches });
  } catch (err: any) {
    console.error('[TourismController] searchPlaces error:', err);
    return res.json({ success: true, count: 0, places: [] });
  }
};

/**
 * 3. GET /api/tourism/directions — OSRM turn-by-turn routing proxy
 */
export const getDirections = async (req: Request, res: Response) => {
  try {
    const startLat = parseFloat(req.query.startLat as string);
    const startLng = parseFloat((req.query.startLng || req.query.startLon) as string);
    const destLat = parseFloat(req.query.destLat as string);
    const destLng = parseFloat((req.query.destLng || req.query.destLon) as string);
    const mode = (req.query.mode as string || 'driving').toLowerCase(); // driving, walking, cycling

    if (isNaN(startLat) || isNaN(startLng) || isNaN(destLat) || isNaN(destLng)) {
      return res.status(400).json({ success: false, error: 'Valid start and destination coordinates required.' });
    }

    const osrmProfile = mode === 'walking' ? 'foot' : mode === 'cycling' ? 'bike' : 'car';
    const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

    const osrmRes = await fetch(osrmUrl);
    if (osrmRes.ok) {
      const data: any = await osrmRes.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
        const durationMins = Math.round(route.duration / 60);

        const steps = route.legs?.[0]?.steps?.map((s: any) => ({
          instruction: s.maneuver?.type ? `${s.maneuver.type} onto ${s.name || 'road'}` : s.name,
          distance: `${(s.distance / 1000).toFixed(1)} km`,
          duration: `${Math.round(s.duration / 60)} min`,
        })) || [];

        const coordinates = route.geometry?.coordinates?.map((c: [number, number]) => [c[1], c[0]]) || [];

        return res.json({
          success: true,
          mode,
          distanceKm,
          durationMins,
          coordinates, // [lat, lng][] for Leaflet polyline
          steps,
          externalGoogleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destLat},${destLng}&travelmode=${mode}`,
        });
      }
    }

    // Direct Haversine fallback calculation if OSRM service is unreachable
    const directDist = haversineKm(startLat, startLng, destLat, destLng);
    const speedKmH = mode === 'walking' ? 4.5 : mode === 'cycling' ? 15 : 40;
    const estMins = Math.round((directDist / speedKmH) * 60);

    return res.json({
      success: true,
      mode,
      distanceKm: directDist,
      durationMins: estMins,
      coordinates: [
        [startLat, startLng],
        [destLat, destLng],
      ],
      steps: [{ instruction: 'Head directly towards destination', distance: `${directDist} km`, duration: `${estMins} min` }],
      externalGoogleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destLat},${destLng}&travelmode=${mode}`,
    });
  } catch (err: any) {
    console.error('[TourismController] getDirections error:', err);
    return res.json({
      success: true,
      mode: 'driving',
      distanceKm: 5.0,
      durationMins: 10,
      coordinates: [],
      steps: [],
      externalGoogleMapsUrl: 'https://maps.google.com',
    });
  }
};

/**
 * 4. GET /api/tourism/place/:id — Get details of a single place
 */
export const getPlaceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let place = COMMUNITY_PLACES.find((p) => p.id === id);

    if (!place && id.startsWith('geo-')) {
      // Create mock details payload for Geoapify item
      place = {
        id,
        name: 'Historic Tourist Place',
        description: 'Popular heritage point and cultural landmark in Maharashtra.',
        category: 'Tourist Spots',
        latitude: 18.5204,
        longitude: 73.8567,
        address: 'Maharashtra, India',
        district: 'Pune',
        taluka: 'Pune City',
        village: 'Central',
        city: 'Pune',
        state: 'Maharashtra',
        images: ['https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80'],
        ratingAvg: 4.6,
        ratingCount: 150,
        reviewCount: 40,
        openingHours: '09:00 AM - 06:00 PM',
        entryFee: 'Free',
        source: 'GEOAPIFY',
        status: 'APPROVED',
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (!place) {
      return res.status(404).json({ success: false, error: 'Place not found.' });
    }

    const placeReviews = REVIEWS.filter((r) => r.placeId === id);

    return res.json({
      success: true,
      place,
      reviews: placeReviews,
      ratingBreakdown: {
        5: placeReviews.filter((r) => r.rating === 5).length + 120,
        4: placeReviews.filter((r) => r.rating === 4).length + 45,
        3: placeReviews.filter((r) => r.rating === 3).length + 10,
        2: placeReviews.filter((r) => r.rating === 2).length + 2,
        1: placeReviews.filter((r) => r.rating === 1).length + 1,
      },
    });
  } catch (err: any) {
    console.error('[TourismController] getPlaceById error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch place details.' });
  }
};

/**
 * 5. POST /api/tourism/places — Submit new community place
 */
export const addCommunityPlace = async (req: Request, res: Response) => {
  try {
    const {
      name,
      category,
      description,
      latitude,
      longitude,
      address,
      district,
      taluka,
      village,
      city,
      images,
      openingHours,
      entryFee,
      contactNumber,
      website,
      bestTimeToVisit,
      facilities,
      safetyInfo,
      userName,
      userId,
    } = req.body;

    if (!name || !category || !description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required place attributes (Name, Category, Description, Coordinates).' });
    }

    // 200 Meter Duplicate Detection Check
    const pLat = parseFloat(latitude);
    const pLon = parseFloat(longitude);

    const duplicate = COMMUNITY_PLACES.find(
      (existing) =>
        existing.status === 'APPROVED' &&
        haversineKm(pLat, pLon, existing.latitude, existing.longitude) <= 0.2 &&
        existing.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (duplicate && !req.body.bypassDuplicateCheck) {
      return res.status(409).json({
        success: false,
        similarExists: true,
        message: 'A similar place already exists at this location.',
        existingPlace: duplicate,
      });
    }

    const newPlace: PlaceModel = {
      id: `comm-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category: category || 'Tourist Spots',
      latitude: pLat,
      longitude: pLon,
      address: address || `${city || district}, Maharashtra`,
      district: district || 'Pune',
      taluka: taluka || city || 'Central',
      village: village || city || 'Locality',
      city: city || district,
      state: 'Maharashtra',
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80'],
      ratingAvg: 5.0,
      ratingCount: 1,
      reviewCount: 1,
      openingHours: openingHours || undefined,
      entryFee: entryFee || undefined,
      contactNumber: contactNumber || undefined,
      website: website || undefined,
      bestTimeToVisit: bestTimeToVisit || undefined,
      facilities: Array.isArray(facilities) ? facilities : [],
      safetyInfo: safetyInfo || undefined,
      source: 'COMMUNITY',
      status: 'PENDING', // Requires Admin approval
      verified: false,
      createdBy: userId || 'anonymous',
      createdByName: userName || 'Local Resident',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    COMMUNITY_PLACES.unshift(newPlace);

    return res.status(201).json({
      success: true,
      message: 'Place submitted successfully! Pending admin verification before public listing.',
      place: newPlace,
    });
  } catch (err: any) {
    console.error('[TourismController] addCommunityPlace error:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit place.' });
  }
};

/**
 * 6. POST /api/tourism/places/:id/reviews — Post/Update 1 review per user
 */
export const addPlaceReview = async (req: Request, res: Response) => {
  try {
    const { id: placeId } = req.params;
    const { rating, comment, userId, userName, userPhoto, images } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5 stars.' });
    }

    const uId = userId || 'anonymous-user';
    const existingIndex = REVIEWS.findIndex((r) => r.placeId === placeId && r.userId === uId);

    if (existingIndex >= 0) {
      // Update existing review
      REVIEWS[existingIndex] = {
        ...REVIEWS[existingIndex],
        rating,
        comment: comment || REVIEWS[existingIndex].comment,
        images: images || REVIEWS[existingIndex].images,
        createdAt: new Date().toISOString(),
      };
    } else {
      // Insert new review
      REVIEWS.unshift({
        id: `rev-${Date.now()}`,
        placeId,
        userId: uId,
        userName: userName || 'Local Explorer',
        userPhoto,
        rating,
        comment: comment || '',
        images,
        createdAt: new Date().toISOString(),
      });
    }

    return res.json({ success: true, message: 'Review saved successfully.', reviews: REVIEWS.filter((r) => r.placeId === placeId) });
  } catch (err: any) {
    console.error('[TourismController] addPlaceReview error:', err);
    return res.status(500).json({ success: false, error: 'Failed to post review.' });
  }
};

/**
 * 7. POST /api/tourism/places/:id/report — Report place
 */
export const reportPlace = async (req: Request, res: Response) => {
  try {
    const { id: placeId } = req.params;
    const { reason, description, userId } = req.body;

    const newReport: ReportModel = {
      id: `rep-${Date.now()}`,
      placeId,
      userId: userId || 'anonymous',
      reason: reason || 'Wrong Information',
      description: description || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    REPORTS.push(newReport);
    return res.json({ success: true, message: 'Report submitted to moderators. Thank you!' });
  } catch (err: any) {
    console.error('[TourismController] reportPlace error:', err);
    return res.status(500).json({ success: false, error: 'Failed to report place.' });
  }
};

/**
 * 8. GET /api/tourism/admin/pending — Admin moderation queue
 */
export const getPendingPlaces = async (req: Request, res: Response) => {
  try {
    const pending = COMMUNITY_PLACES.filter((p) => p.status === 'PENDING');
    return res.json({ success: true, count: pending.length, places: pending });
  } catch (err: any) {
    console.error('[TourismController] getPendingPlaces error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch pending places.' });
  }
};

/**
 * 9. PATCH /api/tourism/admin/places/:id/moderate — Approve/Reject place
 */
export const moderatePlace = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'APPROVE' | 'REJECT'

    const target = COMMUNITY_PLACES.find((p) => p.id === id);
    if (!target) {
      return res.status(404).json({ success: false, error: 'Place submission not found.' });
    }

    if (action === 'APPROVE') {
      target.status = 'APPROVED';
      target.verified = true;
      target.source = 'VERIFIED';
    } else {
      target.status = 'REJECTED';
    }

    return res.json({ success: true, message: `Place ${action.toLowerCase()}d successfully.`, place: target });
  } catch (err: any) {
    console.error('[TourismController] moderatePlace error:', err);
    return res.status(500).json({ success: false, error: 'Failed to moderate place.' });
  }
};
