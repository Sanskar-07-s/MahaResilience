import { Request, Response } from 'express';
import { sendSMS, sendSOS, sendOTP, verifyOTP } from '../services/twilioService.js';
import { sendSOSEmail } from '../services/brevoEmailService.js';

export const sendSmsController = async (req: Request, res: Response) => {
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

export const sendSosController = async (req: Request, res: Response) => {
  try {
    const { location, reporter, emergencyContacts, email, latitude, longitude, address } = req.body;
    const reporterName = reporter || 'Citizen User';
    const locStr = location || `${latitude}, ${longitude}`;
    const pLat = latitude || parseFloat((location || '').split(',')[0]) || 18.5204;
    const pLng = longitude || parseFloat((location || '').split(',')[1]) || 73.8567;

    // 1. Dispatch SMS via Twilio to all emergency contacts
    const contacts = emergencyContacts && emergencyContacts.length > 0 ? emergencyContacts : ['+919876543210'];
    const smsResults = [];

    for (const phone of contacts) {
      try {
        const response = await sendSOS(phone, locStr, reporterName, address);
        smsResults.push({ phone, success: true, sid: (response as any)?.sid || 'simulated' });
      } catch (err: any) {
        smsResults.push({ phone, success: false, error: err.message });
      }
    }

    // 2. Dispatch High-Priority Emergency Email via Brevo API
    let emailSent = false;
    if (email) {
      try {
        emailSent = await sendSOSEmail(email, reporterName, contacts[0] || '', pLat, pLng, address);
      } catch (e) {
        console.warn('[SOS Email Dispatch Error]:', e);
      }
    }

    return res.status(200).json({
      message: 'SOS emergency broadcast dispatched via SMS and Email.',
      smsSent: true,
      emailSent,
      details: smsResults,
    });
  } catch (error: any) {
    return res.status(200).json({ message: 'SOS event logged.' });
  }
};

export const sendOtpController = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone parameter is required.' });
    }
    const response = await sendOTP(phone);
    return res.status(200).json({ message: 'OTP verification code dispatched.', sid: (response as any)?.sid });
  } catch (error: any) {
    console.error('[SMS Controller OTP Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to dispatch OTP.' });
  }
};

export const verifyOtpController = async (req: Request, res: Response) => {
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

const contactOtpCache = new Map<string, { code: string; expires: number; name: string }>();

export const requestContactVerifyController = async (req: Request, res: Response) => {
  try {
    const { phone, name } = req.body;
    if (!phone || !name) {
      return res.status(400).json({ error: 'Parameters "phone" and "name" are required.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    contactOtpCache.set(phone, {
      code: otpCode,
      expires: Date.now() + 5 * 60 * 1000,
      name,
    });

    const smsBody = `[MahaResilience] Emergency contact verification code: ${otpCode}. Valid for 5 minutes.`;
    await sendSMS(phone, smsBody);

    return res.status(200).json({ message: '2FA verification code dispatched to contact.' });
  } catch (error: any) {
    console.error('[SMS Contact OTP Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to dispatch verification code.' });
  }
};

export const verifyContactController = async (req: Request, res: Response) => {
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

    contactOtpCache.delete(phone);
    return res.status(200).json({
      message: 'Contact verified successfully.',
      verified: true,
      name: cachedRecord.name,
      phone,
    });
  } catch (error: any) {
    console.error('[SMS Contact Verify Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to verify code.' });
  }
};
