import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ComplaintCategory, ComplaintStatus, Role } from '@prisma/client';

// Helper to calculate complaint priority score
const calculatePriorityScore = (complaint: any): number => {
  // 1. Base weights for categories
  let categoryWeight = 0.5;
  switch (complaint.category) {
    case ComplaintCategory.WATER_LEAK:
      categoryWeight = 0.85;
      break;
    case ComplaintCategory.POTHOLE:
      categoryWeight = 0.75;
      break;
    case ComplaintCategory.ILLEGAL_DUMPING:
      categoryWeight = 0.65;
      break;
    case ComplaintCategory.GARBAGE:
      categoryWeight = 0.6;
      break;
    case ComplaintCategory.STREETLIGHT:
      categoryWeight = 0.5;
      break;
    case ComplaintCategory.PUBLIC_TOILET:
      categoryWeight = 0.45;
      break;
    default:
      categoryWeight = 0.4;
  }

  // 2. Upvote component (up to 100 upvotes)
  const upvoteFactor = Math.min(complaint.upvotes, 100) * 0.05;

  // 3. Time component (days elapsed)
  const elapsedMs = Date.now() - new Date(complaint.createdAt).getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  const timeFactor = elapsedDays * 0.1; // Increases priority score gradually over time

  // 4. Return total score
  return categoryWeight * 10 + upvoteFactor + timeFactor;
};

// POST /api/complaints
export const createComplaint = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, latitude, longitude, address, photoUrl } = req.body;

    if (!title || !description || !category || !latitude || !longitude || !address) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const complaintCategory = Object.values(ComplaintCategory).includes(category as ComplaintCategory)
      ? (category as ComplaintCategory)
      : ComplaintCategory.OTHER;

    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        category: complaintCategory,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        photoUrl,
        citizenId: req.user!.id,
        status: ComplaintStatus.PENDING,
      },
    });

    return res.status(201).json({
      message: 'Complaint submitted successfully.',
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/complaints
export const getComplaints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, category, sortBy } = req.query;

    const filter: any = {};
    if (status) {
      filter.status = status as ComplaintStatus;
    }
    if (category) {
      filter.category = category as ComplaintCategory;
    }

    const complaints = await prisma.complaint.findMany({
      where: filter,
      include: {
        citizen: {
          select: { id: true, name: true, profileImage: true },
        },
        assignee: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map priority score dynamically
    const enriched = complaints.map((complaint) => {
      const score = calculatePriorityScore(complaint);
      let priority = 'LOW';
      if (score > 12) priority = 'CRITICAL';
      else if (score > 8) priority = 'HIGH';
      else if (score > 5) priority = 'MEDIUM';

      return {
        ...complaint,
        priorityScore: score,
        priority,
      };
    });

    // Sort by priority if requested
    if (sortBy === 'priority') {
      enriched.sort((a, b) => b.priorityScore - a.priorityScore);
    }

    return res.json(enriched);
  } catch (error) {
    next(error);
  }
};

// PUT /api/complaints/:id/upvote
export const upvoteComplaint = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        upvotes: {
          increment: 1,
        },
      },
    });

    return res.json({
      message: 'Complaint upvoted successfully.',
      upvotes: updated.upvotes,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/complaints/:id/assign (ADMIN, OFFICIAL, MUNICIPAL_STAFF only)
export const assignComplaint = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;

    if (!assigneeId) {
      return res.status(400).json({ error: 'Assignee ID is required.' });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!assignee) {
      return res.status(404).json({ error: 'Assignee user not found.' });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        assigneeId,
        status: ComplaintStatus.IN_PROGRESS,
      },
    });

    return res.json({
      message: 'Complaint assigned and status marked as IN_PROGRESS.',
      complaint: updated,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/complaints/:id/status (ADMIN, OFFICIAL, or assigned MUNICIPAL_STAFF)
export const updateComplaintStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(ComplaintStatus).includes(status as ComplaintStatus)) {
      return res.status(400).json({ error: 'Valid complaint status is required.' });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Role checks
    const isAuthorized =
      req.user!.role === Role.ADMIN ||
      req.user!.role === Role.OFFICIAL ||
      complaint.assigneeId === req.user!.id;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied: Unauthorized to modify status.' });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: status as ComplaintStatus,
      },
    });

    return res.json({
      message: `Complaint status updated to ${status}.`,
      complaint: updated,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/complaints/safety-score?lat=...&lng=...
export const getSafetyScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;

    if (lat === null || lng === null) {
      return res.status(400).json({ error: 'Coordinates are required to calculate safety score.' });
    }

    // Retrieve active complaints within vicinity or globally
    const totalComplaints = await prisma.complaint.count();
    const resolvedComplaints = await prisma.complaint.count({
      where: { status: ComplaintStatus.RESOLVED },
    });

    const activeDisasters = await prisma.alert.count({
      where: {
        severity: 'CRITICAL',
        expiresAt: { gt: new Date() },
      },
    });

    // Mock active streetlight ratio. In production, we inspect IoT streetlight registers
    const activeStreetlightRatio = 0.92;

    const resolutionRate = totalComplaints > 0 ? resolvedComplaints / totalComplaints : 1.0;
    const disasterFactor = activeDisasters > 0 ? 0.3 : 1.0;

    // Safety Score formula
    const css = 100 * (0.4 * activeStreetlightRatio + 0.3 * resolutionRate + 0.3 * disasterFactor);

    return res.json({
      safetyScore: Math.round(css),
      metrics: {
        streetlightRatio: activeStreetlightRatio,
        complaintResolutionRate: resolutionRate,
        criticalDisastersCount: activeDisasters,
      },
    });
  } catch (error) {
    next(error);
  }
};
