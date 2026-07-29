import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  upvoteComplaint,
  assignComplaint,
  updateComplaintStatus,
  getSafetyScore,
} from '../controllers/complaintController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// Public lookups
router.get('/', getComplaints);
router.get('/safety-score', getSafetyScore);

// Citizen authenticated routes
router.post('/', authenticate as any, createComplaint as any);
router.put('/:id/upvote', authenticate as any, upvoteComplaint as any);

// Assign & status updates (Officials/Admins)
router.put(
  '/:id/assign',
  authenticate as any,
  authorize([Role.ADMIN, Role.OFFICIAL, Role.MUNICIPAL_STAFF]) as any,
  assignComplaint as any
);
router.put('/:id/status', authenticate as any, updateComplaintStatus as any);

export default router;
