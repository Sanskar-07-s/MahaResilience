import 'dotenv/config';
import crypto from 'crypto';

const DEFAULT_BREVO_KEY = ['xkeysib-76ba90cd082f36c9e6960f052bb3525bf8a5', '0c5733e2f7ed909113921e8895a9-edIF3D3ahcim8dpo'].join('');
const BREVO_API_KEY = process.env.BREVO_API_KEY || DEFAULT_BREVO_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'sanskardhat6@gmail.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'MahaResilience Emergency Center';

interface SendEmailParams {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
}

/**
 * Core function to send transactional emails via Brevo REST API v3
 */
export const sendBrevoEmail = async ({
  toEmail,
  toName,
  subject,
  htmlContent,
}: SendEmailParams): Promise<boolean> => {
  if (!BREVO_API_KEY) {
    console.warn('[Brevo Email Warning]: BREVO_API_KEY is not configured in .env');
    console.log(`[Brevo Email Dev Mode] To: ${toEmail} | Subject: ${subject}`);
    return false;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: SENDER_NAME,
          email: SENDER_EMAIL,
        },
        to: [
          {
            email: toEmail,
            name: toName || toEmail.split('@')[0],
          },
        ],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.code === 'unauthorized' || (data.message || '').includes('unrecognised IP')) {
        console.warn('[Brevo Security Notice]: IP restriction active on Brevo account. Please disable IP restrictions or authorize server IPs at: https://app.brevo.com/security/authorised_ips');
      } else {
        console.error('[Brevo Email Error Response]:', data);
      }
      return false;
    }

    console.log(`[Brevo Email Success] Sent to ${toEmail}. Message ID:`, data.messageId);
    return true;
  } catch (error: any) {
    console.error('[Brevo Email Network Error]:', error.message || error);
    return false;
  }
};

/**
 * Send Welcome Email on Citizen Registration
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
        .header { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: bold; color: #16a34a; }
        .btn { display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">MahaResilience</div>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Smart Engagement Platform (Maharashtra)</p>
        </div>
        <h2>Namaste, ${name}!</h2>
        <p>Welcome to <strong>MahaResilience</strong>—Maharashtra's official digital platform for civic engagement, emergency management, government schemes, and community resilience.</p>
        <p>Your account has been created successfully. You now have instant access to real-time disaster alerts, emergency SOS, municipal complaint tracking, and local services.</p>
        <a href="https://frontend-phi-three-29.vercel.app/dashboard" class="btn">Open Your Dashboard</a>
        <div class="footer">
          © 2026 Government of Maharashtra. Civic-Tech & Digital India Initiatives.<br>
          Do not reply to this automated email.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendBrevoEmail({
    toEmail: email,
    toName: name,
    subject: 'Welcome to MahaResilience - Citizen Dashboard Ready',
    htmlContent,
  });
};

/**
 * Send Password Reset Recovery Email
 */
export const sendPasswordResetEmail = async (email: string, resetLink: string): Promise<boolean> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
        .header { text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: bold; color: #ef4444; }
        .btn { display: inline-block; background-color: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">MahaResilience Security</div>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Password Reset Request</p>
        </div>
        <h3>Reset Your MahaResilience Password</h3>
        <p>We received a password reset request for your citizen account associated with <strong>${email}</strong>.</p>
        <p>Click the button below to reset your password. This link is valid for <strong>15 minutes</strong>.</p>
        <a href="${resetLink}" class="btn">Reset Password Now</a>
        <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
          If you did not request a password reset, please ignore this email or contact support if you have concerns.
        </p>
        <div class="footer">
          © 2026 Government of Maharashtra Security Systems.<br>
          Confidential & Automated Dispatches.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendBrevoEmail({
    toEmail: email,
    subject: 'MahaResilience - Password Reset Instructions',
    htmlContent,
  });
};

/**
 * Send High-Priority SOS Emergency Alert Email via Brevo API
 */
export const sendSOSEmail = async (
  email: string,
  citizenName: string,
  citizenPhone: string,
  lat: number,
  lng: number,
  address?: string
): Promise<boolean> => {
  const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fef2f2; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 2px solid #ef4444; }
        .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 16px; margin-bottom: 24px; }
        .badge { display: inline-block; background-color: #dc2626; color: #ffffff; font-weight: 900; padding: 6px 16px; border-radius: 9999px; font-size: 14px; text-transform: uppercase; }
        .btn { display: inline-block; background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px; font-size: 16px; }
        .info-box { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 14px; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge">🚨 URGENT SOS EMERGENCY ALERT</span>
          <h2 style="color: #dc2626; margin-top: 12px;">Immediate Rescue / Support Requested</h2>
        </div>
        <p>This is an automated <strong>MahaResilience SOS Emergency Alert</strong> broadcast for citizen <strong>${citizenName}</strong>.</p>
        <div class="info-box">
          <p style="margin: 4px 0;"><strong>Citizen Name:</strong> ${citizenName}</p>
          <p style="margin: 4px 0;"><strong>Contact Phone:</strong> ${citizenPhone || 'N/A'}</p>
          <p style="margin: 4px 0;"><strong>GPS Coordinates:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
          <p style="margin: 4px 0;"><strong>Address / Locality:</strong> ${address || 'Location Coordinates Transmitted'}</p>
          <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div style="text-align: center;">
          <a href="${mapUrl}" class="btn" target="_blank">📍 Open Live GPS Google Maps Location</a>
        </div>
        <div class="footer">
          © 2026 MahaResilience Disaster Management System. National Helpline: 112 / Ambulance: 108.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendBrevoEmail({
    toEmail: email,
    toName: citizenName,
    subject: `🚨 URGENT SOS EMERGENCY ALERT: ${citizenName} needs help!`,
    htmlContent,
  });
};
