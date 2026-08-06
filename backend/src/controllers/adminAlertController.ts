import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';

interface AlertModel {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  district?: string;
  taluka?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  startTime?: string;
  endTime?: string;
  image?: string;
  attachments?: string[];
  isPinned: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  createdBy?: string;
  createdAt: string;
}

// In-memory alert store for fast regional alerts sync
const alertsStore: AlertModel[] = [
  {
    id: 'alert-critical-1',
    title: '🚨 CRITICAL WEATHER ALERT: Extreme Rainfall Warning Pune & Raigad',
    description: 'Heavy precipitation forecast for the next 24 hours. Disaster management teams deployed near river basins. Residents in low-lying areas advised to move to elevated shelters.',
    category: 'Disaster',
    priority: 'Critical',
    district: 'Pune',
    isPinned: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'alert-high-2',
    title: '⚠️ Water Interruption Notice (Mumbai K-East Ward)',
    description: 'Pipeline repair works underway. Supply disrupted until 6 PM.',
    category: 'Infrastructure',
    priority: 'High',
    district: 'Mumbai Suburban',
    isPinned: false,
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

/**
 * GET /api/alerts - Get all active alerts
 */
export const getAlertsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json({ success: true, count: alertsStore.length, alerts: alertsStore });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/alerts/create - Create new alert (Admin only)
 */
export const createAlertController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, priority, district, taluka, village, latitude, longitude, radius, isPinned, image } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required.' });
    }

    const newAlert: AlertModel = {
      id: `alert-${Date.now()}`,
      title,
      description,
      category,
      priority: priority || 'Medium',
      district: district || 'All Districts',
      taluka,
      village,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
      isPinned: priority === 'Critical' ? true : (isPinned ?? false),
      status: 'ACTIVE',
      image,
      createdBy: req.user?.id || 'admin',
      createdAt: new Date().toISOString(),
    };

    alertsStore.unshift(newAlert);

    return res.status(201).json({
      success: true,
      message: 'Alert published successfully and routed to regional users.',
      alert: newAlert,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/alerts/:id/pin - Toggle alert pin status
 */
export const togglePinAlertController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const alert = alertsStore.find((a) => a.id === id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found.' });
    }

    alert.isPinned = !alert.isPinned;
    return res.status(200).json({ success: true, isPinned: alert.isPinned, alert });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/alerts/:id - Expire or delete alert
 */
export const deleteAlertController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const index = alertsStore.findIndex((a) => a.id === id);

    if (index !== -1) {
      alertsStore.splice(index, 1);
    }

    return res.status(200).json({ success: true, message: 'Alert removed successfully.' });
  } catch (error) {
    next(error);
  }
};
