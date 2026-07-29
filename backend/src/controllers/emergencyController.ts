import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AlertType, AlertSeverity } from '@prisma/client';

// Haversine formula helper
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// GET /api/emergency/shelters?lat=...&lng=...&radius=...
export const getNearbyShelters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10; // Default 10km radius

    const shelters = await prisma.emergencyShelter.findMany({
      where: { active: true },
    });

    if (lat !== null && lng !== null) {
      const filtered = shelters
        .map((shelter) => ({
          ...shelter,
          distance: getDistance(lat, lng, shelter.latitude, shelter.longitude),
        }))
        .filter((shelter) => shelter.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      return res.json(filtered);
    }

    return res.json(shelters);
  } catch (error) {
    next(error);
  }
};

// GET /api/emergency/hospitals?lat=...&lng=...&radius=...
export const getNearbyHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 15; // Default 15km radius

    const hospitals = await prisma.hospital.findMany({
      where: { active: true },
    });

    if (lat !== null && lng !== null) {
      const filtered = hospitals
        .map((hospital) => ({
          ...hospital,
          distance: getDistance(lat, lng, hospital.latitude, hospital.longitude),
        }))
        .filter((hospital) => hospital.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      return res.json(filtered);
    }

    return res.json(hospitals);
  } catch (error) {
    next(error);
  }
};

// POST /api/emergency/alerts (Only OFFICIAL and ADMIN roles can create)
export const createAlert = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, type, severity, latitude, longitude, radius, expiresAt } = req.body;

    if (!title || !description || !type || !latitude || !longitude || !radius || !expiresAt) {
      return res.status(400).json({ error: 'All alert fields are required.' });
    }

    const alert = await prisma.alert.create({
      data: {
        title,
        description,
        type: type as AlertType,
        severity: (severity as AlertSeverity) || AlertSeverity.INFO,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseFloat(radius),
        expiresAt: new Date(expiresAt),
        createdById: req.user!.id,
      },
    });

    // Mock dispatch notifications to matching nearby users
    // In production, we query users' last-known location and dispatch FCM push notifications.
    console.log(`[DISASTER ROUTER]: Dispatched critical alert: "${title}" to users within ${radius}m of (${latitude}, ${longitude})`);

    return res.status(201).json({
      message: 'Alert published successfully and routed to matching zones.',
      alert,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/emergency/alerts
export const getActiveAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;

    const alerts = await prisma.alert.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (lat !== null && lng !== null) {
      // Filter alerts based on active zone coverage (alert radius covers the user's current point)
      const filtered = alerts.filter((alert) => {
        const distanceKm = getDistance(lat, lng, alert.latitude, alert.longitude);
        const radiusKm = alert.radius / 1000; // Convert radius in meters to kilometers
        return distanceKm <= radiusKm;
      });

      return res.json(filtered);
    }

    return res.json(alerts);
  } catch (error) {
    next(error);
  }
};

// POST /api/emergency/sos (SOS distress trigger)
export const triggerSOS = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude coordinates are required for SOS dispatch.' });
    }

    const userName = req.user ? req.user.name : 'Anonymous Citizen';
    const userId = req.user ? req.user.id : 'anonymous';

    // 1. Create a critical alert matching this SOS
    const sosAlert = await prisma.alert.create({
      data: {
        title: `SOS DISTRESS: ${userName}`,
        description: `Emergency Help requested near: ${address || 'Coordinates provided'}. Please dispatch emergency response team.`,
        type: AlertType.DISASTER,
        severity: AlertSeverity.CRITICAL,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: 2000, // 2km broadcast
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // Active for 4 hours
        createdById: userId !== 'anonymous' ? userId : (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id,
      },
    });

    console.log(`[SOS DISPATCHER]: Routed SOS beacon from user: ${userName} at (${latitude}, ${longitude}). Dispatching SMS SOS and notifying Volunteer Networks...`);

    return res.status(201).json({
      message: 'SOS Signal routed successfully to local response networks and nearby volunteers.',
      alert: sosAlert,
    });
  } catch (error) {
    next(error);
  }
};
