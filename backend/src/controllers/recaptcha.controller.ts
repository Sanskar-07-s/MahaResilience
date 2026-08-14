import { Request, Response } from 'express';

export const verifyRecaptchaToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'reCAPTCHA token is required.' });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LcdL4UtAAAAAEQVNxgarr2Lk9HWafa3vDt7FL-R';
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(
      secretKey
    )}&response=${encodeURIComponent(token)}`;

    const googleRes = await fetch(verifyUrl, { method: 'POST' });
    const googleData = await googleRes.json();

    if (googleData.success) {
      return res.json({ success: true, message: 'reCAPTCHA verification passed.' });
    } else {
      return res.status(400).json({
        success: false,
        error: 'reCAPTCHA verification failed.',
        details: googleData['error-codes'] || [],
      });
    }
  } catch (err: any) {
    console.error('[reCAPTCHA Controller] Verification error:', err);
    return res.status(500).json({ success: false, error: 'Internal reCAPTCHA verification error.' });
  }
};
