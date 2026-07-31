import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACmockaccount';
const apiKeySid = process.env.TWILIO_API_KEY_SID || 'SKmockapisid';
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET || 'mockapisecret';
const phoneNumber = process.env.TWILIO_PHONE_NUMBER || '+15017122661';
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || 'VA-mock-verify-sid';

const client = twilio(apiKeySid, apiKeySecret, { accountSid });

export const sendSMS = async (to: string, body: string) => {
  console.log(`[Twilio Service] Sending SMS to ${to}: ${body}`);
  return client.messages.create({
    body,
    from: phoneNumber,
    to,
  });
};

export const sendSOS = async (to: string, location: string, reporter: string) => {
  const sosBody = `🚨 EMERGENCY SOS BEACON DETECTED!\nReporter: ${reporter}\nLock Coords: ${location}\nRescue assets routed. Please stay safe.`;
  return sendSMS(to, sosBody);
};

export const sendOTP = async (phone: string) => {
  console.log(`[Twilio Service] Dispatching OTP code for verification to ${phone}`);
  return client.verify.v2.services(verifyServiceSid).verifications.create({
    to: phone,
    channel: 'sms',
  });
};

export const verifyOTP = async (phone: string, code: string) => {
  console.log(`[Twilio Service] Checking verification code ${code} for phone ${phone}`);
  const verificationCheck = await client.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({
      to: phone,
      code,
    });
  return verificationCheck.status === 'approved';
};
