import { Router } from 'express';
import {
  getNearbyPlaces,
  searchPlaces,
  getDirections,
  getPlaceById,
  addCommunityPlace,
  addPlaceReview,
  reportPlace,
  getPendingPlaces,
  moderatePlace,
} from '../controllers/tourismController';

const router = Router();

// Public Discovery & Directions
router.get('/nearby', getNearbyPlaces);
router.get('/search', searchPlaces);
router.get('/directions', getDirections);
router.get('/place/:id', getPlaceById);

// Community Contribution & Interactivity
router.post('/places', addCommunityPlace);
router.post('/places/:id/reviews', addPlaceReview);
router.post('/places/:id/report', reportPlace);

// Super Admin Moderation Endpoints
router.get('/admin/pending', getPendingPlaces);
router.patch('/admin/places/:id/moderate', moderatePlace);

export default router;
