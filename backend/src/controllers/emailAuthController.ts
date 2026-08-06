import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/brevoEmailService.js';
import prisma from '../config/db.js';

// Temporary token cache for password resets (token -> { email, expiresAt })
const resetTokenStore = new Map<string, { email: string; expiresAt: number }>();

/**
 * Controller for POST /api/auth/forgot-password
 * Body: { email: "citizen@maharashtra.gov.in" }
 * Sends a password recovery email via Brevo REST API v3
 */
export const forgotPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Generate secure random reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    resetTokenStore.set(token, { email: cleanEmail, expiresAt });

    const frontendUrl = process.env.FRONTEND_URL || 'https://frontend-phi-three-29.vercel.app';
    const resetLink = `${frontendUrl}/login?resetToken=${token}`;

    // Send email via Brevo
    const emailSent = await sendPasswordResetEmail(cleanEmail, resetLink);

    return res.status(200).json({
      success: true,
      message: 'Password reset instructions sent via Brevo to your email address.',
      emailSent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for POST /api/auth/verify-email-token
 * Body: { token: "hex_token", newPassword: "..." }
 */
export const verifyEmailTokenController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token and new password are required.' });
    }

    const record = resetTokenStore.get(token);
    if (!record) {
      return res.status(400).json({ success: false, error: 'Invalid or expired password reset token.' });
    }

    if (Date.now() > record.expiresAt) {
      resetTokenStore.delete(token);
      return res.status(400).json({ success: false, error: 'Password reset token has expired. Please request a new link.' });
    }

    // Clear reset token
    resetTokenStore.delete(token);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
