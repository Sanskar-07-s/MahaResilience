import { Router } from 'express';
import {
  getTouristPlaces,
  createTouristPlace,
  getTransportStations,
  createTransportStation,
  reportWaste,
  getWasteReports,
  reportPestBreeding,
  getPestReports,
  createEvent,
  getEvents,
} from '../controllers/civicController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// Tourism & Transport Lookups
router.get('/tourism', getTouristPlaces);
router.get('/transport', getTransportStations);

// Write Tourist Spots & Stations (Officials/Admins)
router.post('/tourism', authenticate as any, authorize([Role.ADMIN, Role.OFFICIAL]) as any, createTouristPlace as any);
router.post('/transport', authenticate as any, authorize([Role.ADMIN, Role.OFFICIAL]) as any, createTransportStation as any);

// Waste Reporting
router.post('/waste', authenticate as any, reportWaste as any);
router.get('/waste', getWasteReports);

// Pest Control Reports
router.post('/pest', authenticate as any, reportPestBreeding as any);
router.get('/pest', getPestReports);

// Events
router.post('/events', authenticate as any, createEvent as any);
router.get('/events', getEvents);

export default router;
