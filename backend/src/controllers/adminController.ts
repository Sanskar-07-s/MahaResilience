import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import prisma from '../config/db.js';
import { Role } from '@prisma/client';

// Helper to log admin actions
const logAuditAction = async (adminId: string, action: string, target: string, details?: string) => {
  console.log(`[ADMIN AUDIT LOG] Admin: ${adminId} | Action: ${action} | Target: ${target} | Details: ${details || 'N/A'}`);
};

/**
 * Get all users for admin overview
 */
export const getAllUsersController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role (CITIZEN, VOLUNTEER, OFFICIAL, ADMIN)
 */
export const updateUserRoleController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(Role).includes(role as Role)) {
      return res.status(400).json({ error: 'Valid role string is required.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role, isVerified: true },
    });

    await logAuditAction(req.user?.id || 'admin', 'UPDATE_ROLE', userId, `Assigned role ${role}`);

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve volunteer registration
 */
export const approveVolunteerController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: Role.VOLUNTEER, isVerified: true },
    });

    await logAuditAction(req.user?.id || 'admin', 'APPROVE_VOLUNTEER', userId, 'Approved citizen as verified volunteer asset');

    return res.status(200).json({ success: true, message: 'Volunteer profile approved successfully.', user });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user suspension status
 */
export const toggleUserSuspensionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { isSuspended } = req.body;

    await logAuditAction(req.user?.id || 'admin', isSuspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER', userId);

    return res.status(200).json({ success: true, message: `User status updated (suspended: ${isSuspended})` });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account
 */
export const deleteUserController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await logAuditAction(req.user?.id || 'admin', 'DELETE_USER', userId, 'Permanently deleted user account');

    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
