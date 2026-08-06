import crypto from 'crypto';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@maharesilience.org';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'MahaResilience Platform';

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
      console.error('[Brevo Email Error Response]:', data);
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
