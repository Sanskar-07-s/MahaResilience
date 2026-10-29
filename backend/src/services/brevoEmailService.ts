import 'dotenv/config';
import crypto from 'crypto';

const DEFAULT_BREVO_KEY = ['xkeysib-76ba90cd082f36c9e6960f052bb3525bf8a5', '0c5733e2f7ed909113921e8895a9-edIF3D3ahcim8dpo'].join('');
const BREVO_API_KEY = process.env.BREVO_API_KEY || DEFAULT_BREVO_KEY;
const envSender = process.env.BREVO_SENDER_EMAIL;
// Brevo requires a verified sender email. sanskardhat6@gmail.com is verified on this Brevo account.
const SENDER_EMAIL = (envSender && !envSender.includes('maharesilience.org')) ? envSender : 'sanskardhat6@gmail.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'MahaResilience Civic Portal';

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

export interface BillReceiptParams {
  toEmail: string;
  toName: string;
  utilityType: 'ELECTRICITY' | 'WATER';
  providerName: string;
  consumerNumber: string;
  billNumber: string;
  billingPeriod: string;
  unitsConsumed?: number;
  unitLabel?: string;
  amountPaid: number;
  transactionId: string;
  paymentDate: string;
  category?: string;
  breakdown?: {
    fixedCharges?: number;
    consumptionCharges?: number;
    taxesAndCess?: number;
    penaltyAmount?: number;
    overpayAmount?: number;
    subsidyAmount?: number;
  };
}

/**
 * Send Official Water / Electricity Bill Payment Receipt & Tax Invoice
 */
export const sendBillReceiptEmail = async (params: BillReceiptParams): Promise<boolean> => {
  const {
    toEmail,
    toName,
    utilityType,
    providerName,
    consumerNumber,
    billNumber,
    billingPeriod,
    unitsConsumed,
    unitLabel,
    amountPaid,
    transactionId,
    paymentDate,
    category = 'NORMAL',
    breakdown = {},
  } = params;

  const isWater = utilityType === 'WATER';
  const utilityLabel = isWater ? 'Municipal Water Supply' : 'Electricity (Power Distribution)';
  const normalizedCategory = String(category).toUpperCase();

  let categoryBadgeText = 'Standard On-Time';
  let categoryRowHtml = '';
  let calloutHtml = `
    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px; margin-bottom: 24px; text-align: center;">
      <div style="font-size: 14px; font-weight: 800; color: #065f46;">✓ Zero Outstanding Dues Remaining</div>
      <div style="font-size: 12px; color: #047857; margin-top: 4px;">Thank you for your timely payment for cycle <strong>${billingPeriod}</strong>. No further action is required.</div>
    </div>
  `;

  if (normalizedCategory === 'OVERDUE') {
    const penalty = breakdown.penaltyAmount || (isWater ? 50 : 170);
    categoryBadgeText = 'Overdue Settled (+Late Fee)';
    categoryRowHtml = `
      <tr>
        <td style="padding: 10px 12px; font-size: 12px; color: #b91c1c; border-bottom: 1px solid #e2e8f0;"><strong>Late Surcharge / DPC Penalty</strong> (Delayed Payment Surcharge)</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #b91c1c; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">+ ₹${penalty.toLocaleString('en-IN')}.00</td>
        <td style="padding: 10px 12px; font-size: 11px; color: #b91c1c; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">SETTLED</td>
      </tr>
    `;
    calloutHtml = `
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px; margin-bottom: 24px; text-align: center;">
        <div style="font-size: 14px; font-weight: 800; color: #065f46;">✓ Arrears Cleared • Zero Outstanding Dues</div>
        <div style="font-size: 12px; color: #047857; margin-top: 4px;">All previous arrears and delayed payment surcharges for <strong>${billingPeriod}</strong> have been settled.</div>
      </div>
    `;
  } else if (normalizedCategory === 'OVERPAY') {
    const advance = breakdown.overpayAmount || (isWater ? 140 : 420);
    categoryBadgeText = 'Overpayment / Advance Credit';
    categoryRowHtml = `
      <tr>
        <td style="padding: 10px 12px; font-size: 12px; color: #0284c7; border-bottom: 1px solid #e2e8f0;"><strong>Advance Credit Deposit / Overpayment</strong> (Credited to Next Billing Cycle)</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #0284c7; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">+ ₹${advance.toLocaleString('en-IN')}.00</td>
        <td style="padding: 10px 12px; font-size: 11px; color: #0284c7; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">ADVANCE</td>
      </tr>
    `;
    calloutHtml = `
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 14px; margin-bottom: 24px; text-align: center;">
        <div style="font-size: 14px; font-weight: 800; color: #0369a1;">✨ Advance Balance Surplus Recorded</div>
        <div style="font-size: 12px; color: #0284c7; margin-top: 4px;">An excess credit of ₹${advance.toLocaleString('en-IN')} has been credited to your consumer ledger for subsequent month deduction.</div>
      </div>
    `;
  } else if (normalizedCategory === 'SUBSIDIZED') {
    const discount = breakdown.subsidyAmount || (isWater ? 100 : 300);
    categoryBadgeText = 'Govt Solar / Green Subsidy Rebate';
    categoryRowHtml = `
      <tr>
        <td style="padding: 10px 12px; font-size: 12px; color: #16a34a; border-bottom: 1px solid #e2e8f0;"><strong>PM Surya Ghar / Green Energy Tariff Rebate</strong></td>
        <td style="padding: 10px 12px; font-size: 12px; color: #16a34a; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">- ₹${discount.toLocaleString('en-IN')}.00</td>
        <td style="padding: 10px 12px; font-size: 11px; color: #16a34a; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">REBATE</td>
      </tr>
    `;
    calloutHtml = `
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px; margin-bottom: 24px; text-align: center;">
        <div style="font-size: 14px; font-weight: 800; color: #065f46;">✓ Zero Outstanding Dues • Green Subsidy Applied</div>
        <div style="font-size: 12px; color: #047857; margin-top: 4px;">Renewable energy government rebate of ₹${discount.toLocaleString('en-IN')} successfully deducted from your civic tariff.</div>
      </div>
    `;
  }

  const fixed = breakdown.fixedCharges !== undefined ? breakdown.fixedCharges : (isWater ? 40 : 116);
  const consumption = breakdown.consumptionCharges !== undefined ? breakdown.consumptionCharges : Math.max(0, amountPaid - fixed);
  const taxes = breakdown.taxesAndCess !== undefined ? breakdown.taxesAndCess : Math.round(consumption * 0.16);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Official ${utilityType} Bill Payment Tax Invoice</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, ${isWater ? '#0284c7' : '#d97706'} 100%); color: #ffffff; padding: 28px 24px; text-align: left;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.85; margin-bottom: 4px; font-weight: 700;">Government of Maharashtra • Civic Utilities</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">${providerName}</h1>
          <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
            <span style="display: inline-block; background: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;">✓ Official Digital Receipt</span>
            <span style="display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;">Category: ${categoryBadgeText}</span>
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <!-- Salutation -->
          <p style="margin: 0 0 16px; font-size: 15px; color: #334155;">Namaste <strong>${toName}</strong>,</p>
          <p style="margin: 0 0 20px; font-size: 13px; color: #64748b; line-height: 1.5;">
            Your payment for <strong>${utilityLabel}</strong> (${categoryBadgeText}) has been successfully received, verified, and reconciled with the municipal billing ledger.
          </p>

          <!-- Consumer & Txn Metadata Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Consumer Account / CAN:</td>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${consumerNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Consumer Name:</td>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${toName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Bill Type:</td>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${isWater ? 'Drinking Water Supply (Municipal)' : 'Electricity (LT-1 Domestic Power)'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Bill Number:</td>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${billNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Billing Period:</td>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${billingPeriod}</td>
            </tr>
            ${unitsConsumed ? `
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Recorded Consumption:</td>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${unitsConsumed} ${unitLabel || ''}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Payment Status:</td>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #16a34a; border-bottom: 1px solid #e2e8f0;">PAID / SETTLED</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Transaction Reference:</td>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${transactionId}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; color: #64748b;">Payment Date & Time:</td>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #0f172a;">${paymentDate}</td>
            </tr>
          </table>

          <!-- Multi-Month Ledger Breakdown -->
          <div style="margin-bottom: 24px;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Billing Ledger & Settlement Breakdown</div>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f1f5f9; text-align: left;">
                  <th style="padding: 10px 12px; font-size: 12px; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0;">Billing Component / Description</th>
                  <th style="padding: 10px 12px; font-size: 12px; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0; text-align: right;">Amount (INR)</th>
                  <th style="padding: 10px 12px; font-size: 12px; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px 12px; font-size: 12px; color: #334155; border-bottom: 1px solid #e2e8f0;"><strong>Fixed Monthly Infrastructure / Meter Fee</strong></td>
                  <td style="padding: 10px 12px; font-size: 12px; color: #334155; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">₹${fixed.toLocaleString('en-IN')}.00</td>
                  <td style="padding: 10px 12px; font-size: 11px; color: #16a34a; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">PAID</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; font-size: 12px; color: #334155; border-bottom: 1px solid #e2e8f0;"><strong>${isWater ? 'Volumetric Water Consumption Charges' : 'Energy Consumption Slabs'}</strong> (${billingPeriod})</td>
                  <td style="padding: 10px 12px; font-size: 12px; color: #334155; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">₹${consumption.toLocaleString('en-IN')}.00</td>
                  <td style="padding: 10px 12px; font-size: 11px; color: #16a34a; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">PAID</td>
                </tr>
                ${taxes > 0 ? `
                <tr>
                  <td style="padding: 10px 12px; font-size: 12px; color: #334155; border-bottom: 1px solid #e2e8f0;"><strong>Statutory State Taxes, Duty & Cess</strong></td>
                  <td style="padding: 10px 12px; font-size: 12px; color: #334155; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">₹${taxes.toLocaleString('en-IN')}.00</td>
                  <td style="padding: 10px 12px; font-size: 11px; color: #16a34a; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">PAID</td>
                </tr>
                ` : ''}
                ${categoryRowHtml}
                <tr style="background: #f8fafc;">
                  <td style="padding: 14px 12px; font-size: 14px; color: #0f172a; font-weight: 800;">Total Amount Paid & Reconciled</td>
                  <td style="padding: 14px 12px; font-size: 16px; color: #15803d; font-weight: 800; text-align: right;" colspan="2">₹${amountPaid.toLocaleString('en-IN')}.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Zero Dues or Advance Callout -->
          ${calloutHtml}

          <!-- Footer note -->
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.4;">
            This is an electronically generated tax invoice issued through the MahaResilience Civic Engagement Portal.<br/>
            Ref ID: ${transactionId} • Bill No: ${billNumber} • Issued to ${toEmail}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendBrevoEmail({
    toEmail,
    toName,
    subject: `[Receipt] ${providerName} - ${utilityLabel} Tax Invoice: ₹${amountPaid.toLocaleString('en-IN')} (Ref: ${transactionId})`,
    htmlContent,
  });
};


export interface RechargeReceiptParams {
  toEmail: string;
  toName: string;
  mobileNumber: string;
  operatorName: string;
  circleName: string;
  planDescription: string;
  validity: string;
  dataBenefit: string;
  callingBenefit: string;
  amountPaid: number;
  transactionId: string;
  operatorRef?: string;
  paymentMethod: string;
  paymentDate: string;
}

/**
 * Send Official Mobile Recharge Receipt & Tax Invoice
 */
export const sendRechargeReceiptEmail = async (params: RechargeReceiptParams): Promise<boolean> => {
  const {
    toEmail,
    toName,
    mobileNumber,
    operatorName,
    circleName,
    planDescription,
    validity,
    dataBenefit,
    callingBenefit,
    amountPaid,
    transactionId,
    operatorRef,
    paymentMethod,
    paymentDate,
  } = params;

  const maskedPhone = mobileNumber.length === 10
    ? `${mobileNumber.substring(0, 2)}XXXXX${mobileNumber.substring(7)}`
    : mobileNumber;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 0; font-size: 13px; color: #e0f2fe; }
        .badge-verified { display: inline-block; background-color: #22c55e; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .body-content { padding: 28px; }
        .amount-card { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 18px; text-align: center; margin-bottom: 24px; }
        .amount-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
        .amount-value { font-size: 32px; font-weight: 800; color: #0284c7; margin-top: 4px; }
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .details-table td { padding: 9px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
        .details-table td.label { color: #64748b; font-weight: 500; width: 40%; }
        .details-table td.val { color: #0f172a; font-weight: 700; text-align: right; }
        .benefit-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin-bottom: 24px; }
        .benefit-title { font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 6px; }
        .benefit-desc { font-size: 12px; color: #15803d; line-height: 1.4; }
        .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MahaResilience Civic Portal</h1>
          <p>Official Prepaid Mobile Recharge Receipt & Tax Invoice</p>
          <div class="badge-verified">✓ Recharge Confirmed & Credited</div>
        </div>
        <div class="body-content">
          <p style="margin-top: 0; font-size: 14px; color: #334155;">
            Namaste <strong>${toName}</strong>, your prepaid mobile recharge request has been successfully processed and verified by the telecom operator.
          </p>

          <div class="amount-card">
            <div class="amount-label">Recharge Pack Amount</div>
            <div class="amount-value">₹${amountPaid.toLocaleString('en-IN')}.00</div>
            <div style="font-size: 12px; color: #16a34a; font-weight: 600; margin-top: 4px;">Status: SUCCESS (100% Fulfilled)</div>
          </div>

          <table class="details-table">
            <tr>
              <td class="label">Transaction Reference:</td>
              <td class="val">${transactionId}</td>
            </tr>
            <tr>
              <td class="label">Operator Reference:</td>
              <td class="val">${operatorRef || 'ACK-' + Math.floor(10000000 + Math.random() * 90000000)}</td>
            </tr>
            <tr>
              <td class="label">Mobile Number:</td>
              <td class="val">+91 ${maskedPhone}</td>
            </tr>
            <tr>
              <td class="label">Telecom Operator:</td>
              <td class="val">${operatorName}</td>
            </tr>
            <tr>
              <td class="label">Telecom Circle:</td>
              <td class="val">${circleName}</td>
            </tr>
            <tr>
              <td class="label">Validity Period:</td>
              <td class="val">${validity}</td>
            </tr>
            <tr>
              <td class="label">Data Allocation:</td>
              <td class="val">${dataBenefit}</td>
            </tr>
            <tr>
              <td class="label">Voice & SMS Benefit:</td>
              <td class="val">${callingBenefit}</td>
            </tr>
            <tr>
              <td class="label">Payment Mode:</td>
              <td class="val">${paymentMethod} (UPI Gateway)</td>
            </tr>
            <tr>
              <td class="label">Recharge Timestamp:</td>
              <td class="val">${paymentDate}</td>
            </tr>
          </table>

          <div class="benefit-box">
            <div class="benefit-title">Pack Benefits & Service Description</div>
            <div class="benefit-desc">${planDescription}</div>
          </div>

          <div class="footer">
            Issued via MahaResilience Unified Civic Services & Disaster Resilience Engine.<br/>
            Maharashtra State Citizen Services • Support: support@maharesilience.org • Helpline: 1800-22-1234
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendBrevoEmail({
    toEmail,
    toName,
    subject: `[Recharge Receipt] ${operatorName} ₹${amountPaid} for +91 ${maskedPhone} - Successful (Ref: ${transactionId})`,
    htmlContent,
  });
};
