import { Request, Response, NextFunction } from 'express';
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
