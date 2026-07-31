import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { sendSMS, sendSOS, sendOTP, verifyOTP } from '../services/twilioService.js';

export const sendSmsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, body } = req.body;
    if (!to || !body) {
      return res.status(400).json({ error: 'Parameters "to" and "body" are required.' });
    }
    const response = await sendSMS(to, body);
    return res.status(200).json({ message: 'SMS sent successfully.', sid: response.sid });
  } catch (error: any) {
    console.error('[SMS Controller Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to dispatch SMS.' });
  }
};

export const sendSosController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location, reporter, emergencyContacts } = req.body;
    if (!location || !reporter) {
      return res.status(400).json({ error: 'Parameters "location" and "reporter" are required.' });
    }

    // List of contact numbers to alert
    const contacts = emergencyContacts || ['+919876543210'];
    const results = [];

    for (const phone of contacts) {
      try {
        const response = await sendSOS(phone, location, reporter);
        results.push({ phone, success: true, sid: response.sid });
      } catch (err: any) {
        results.push({ phone, success: false, error: err.message });
      }
    }

    return res.status(200).json({ message: 'SOS broadcast process completed.', details: results });
  } catch (error: any) {
    next(error);
  }
};

export const sendOtpController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone parameter is required.' });
    }
    const response = await sendOTP(phone);
    return res.status(200).json({ message: 'OTP verification code dispatched.', sid: response.sid });
  } catch (error: any) {
    console.error('[SMS Controller OTP Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to dispatch OTP.' });
  }
};

export const verifyOtpController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Parameters "phone" and "code" are required.' });
    }
    const isApproved = await verifyOTP(phone, code);
    if (isApproved) {
      return res.status(200).json({ message: 'OTP verified successfully.', verified: true });
    } else {
      return res.status(400).json({ error: 'Invalid or expired OTP code.', verified: false });
    }
  } catch (error: any) {
    console.error('[SMS Controller Verify Error]', error);
    return res.status(500).json({ error: error.message || 'OTP verification process failed.' });
  }
};

// In-memory 2FA Verification Cache for Emergency Contacts
const contactOtpCache = new Map<string, { code: string; expires: number; name: string }>();

export const requestContactVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, name } = req.body;
    if (!phone || !name) {
      return res.status(400).json({ error: 'Parameters "phone" and "name" are required.' });
    }

    // Generate secure 6-digit verification code using randomInt
    const otpCode = crypto.randomInt(100000, 999999).toString();
    contactOtpCache.set(phone, {
      code: otpCode,
      expires: Date.now() + 5 * 60 * 1000, // 5 minute validity
      name
    });

    const smsBody = `[MahaResilience] Emergency contact verification code: ${otpCode}. Valid for 5 minutes.`;
    await sendSMS(phone, smsBody);

    return res.status(200).json({ message: '2FA verification code dispatched to contact.' });
  } catch (error: any) {
    console.error('[SMS Contact OTP Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to dispatch verification code.' });
  }
};

export const verifyContactController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Parameters "phone" and "code" are required.' });
    }

    const cachedRecord = contactOtpCache.get(phone);
    if (!cachedRecord) {
      return res.status(400).json({ error: 'No active verification request found for this contact.', verified: false });
    }

    if (Date.now() > cachedRecord.expires) {
      contactOtpCache.delete(phone);
      return res.status(400).json({ error: 'Verification code expired.', verified: false });
    }

    if (cachedRecord.code !== code) {
      return res.status(400).json({ error: 'Incorrect verification code.', verified: false });
    }

    // Verification Success
    contactOtpCache.delete(phone);
    return res.status(200).json({
      message: 'Contact verified successfully.',
      verified: true,
      name: cachedRecord.name,
      phone
    });
  } catch (error: any) {
    console.error('[SMS Contact Verify Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to verify code.' });
  }
};
