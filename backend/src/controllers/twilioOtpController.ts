import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requestOTP, verifyOTP, formatPhoneNumber } from '../services/otpService.js';
import prisma from '../config/db.js';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'maharesilience-secret-session-key-2026-auth';

/**
 * Controller for POST /api/auth/send-otp
 * Body: { phone: "+919876543210" }
 * Response: { success: true, expiresIn: 300 }
 */
export const sendOtpController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid phone number is required.' });
    }

    const formattedPhone = formatPhoneNumber(phone);
    const result = await requestOTP(formattedPhone);

    if (!result.success) {
      return res.status(429).json({ success: false, error: result.error || 'Failed to send OTP.' });
    }

    return res.status(200).json({
      success: true,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for POST /api/auth/verify-otp
 * Body: { phone: "+919876543210", otp: "123456" }
 * Response: { success: true, token: "JWT_TOKEN", user: { ... } }
 */
export const verifyOtpController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp || typeof phone !== 'string' || typeof otp !== 'string') {
      return res.status(400).json({ success: false, error: 'Phone number and 6-digit OTP code are required.' });
    }

    const formattedPhone = formatPhoneNumber(phone);
    const verification = verifyOTP(formattedPhone, otp);

    if (!verification.success) {
      return res.status(400).json({ success: false, error: verification.error || 'Verification failed.' });
    }

    // Find or create user record in database
    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { phone: formattedPhone } });

      if (!user) {
        // Create new user for this phone number
        const fakeEmail = `phone_${formattedPhone.replace(/[^\d]/g, '')}@maharesilience.org`;
        user = await prisma.user.create({
          data: {
            phone: formattedPhone,
            email: fakeEmail,
            name: `Citizen ${formattedPhone.slice(-4)}`,
            role: Role.CITIZEN,
            isVerified: true,
          },
        });
      }
    } catch (dbErr) {
      console.warn('[Prisma Warning]: Database update skipped in offline/mock mode:', dbErr);
    }

    // Generate JWT token
    const userId = user ? user.id : `user_phone_${formattedPhone.replace(/[^\d]/g, '')}`;
    const userName = user ? user.name : `Citizen ${formattedPhone.slice(-4)}`;
    const userRole = user ? user.role : 'CITIZEN';

    const token = jwt.sign(
      { id: userId, phone: formattedPhone, role: userRole, name: userName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = {
      uid: userId,
      id: userId,
      phone: formattedPhone,
      name: userName,
      role: userRole,
      isPhoneVerified: true,
      isVerified: true,
      createdAt: user ? user.createdAt : new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};
