import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import {
  getAllUsersController,
  updateUserRoleController,
  approveVolunteerController,
  toggleUserSuspensionController,
  deleteUserController
} from '../controllers/adminController.js';
import {
  getAlertsController,
  createAlertController,
  togglePinAlertController,
  deleteAlertController
} from '../controllers/adminAlertController.js';

const router = Router();

// Public / Authenticated Alerts Feed
router.get('/alerts', getAlertsController);

// Protected Admin Only Endpoints
router.use(authenticate as any, requireAdmin as any);

// User Management
router.get('/users', getAllUsersController as any);
router.patch('/users/:userId/role', updateUserRoleController as any);
router.post('/users/:userId/approve-volunteer', approveVolunteerController as any);
router.patch('/users/:userId/suspend', toggleUserSuspensionController as any);
router.delete('/users/:userId', deleteUserController as any);

// Alert Management
router.post('/alerts/create', createAlertController as any);
router.patch('/alerts/:id/pin', togglePinAlertController as any);
router.delete('/alerts/:id', deleteAlertController as any);

export default router;
