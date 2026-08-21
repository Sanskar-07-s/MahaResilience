import { sendSMS, sendSOS } from '../services/twilioService.js';
import { sendBrevoEmail, sendSOSEmail } from '../services/brevoEmailService.js';

async function testDispatch() {
  console.log('=== TESTING TWILIO SMS & BREVO EMAIL DISPATCH ===');
  
  // 1. Test Brevo Email
  console.log('\n[1] Testing Brevo Transactional Email...');
  const emailResult = await sendSOSEmail(
    'sanskardhat6@gmail.com',
    'Sanskar Dhat (Test)',
    '+919373245464',
    18.5204,
    73.8567,
    'Pune City Collectorate Campus, Maharashtra'
  );
  console.log('Brevo Email Dispatch Status:', emailResult ? 'SUCCESS ✅' : 'FAILED ❌');

  // 2. Test Twilio SMS
  console.log('\n[2] Testing Twilio SMS Dispatch...');
  const smsResult = await sendSOS(
    '+919209966816',
    '18.5204, 73.8567',
    'Sanskar Dhat (Test)',
    'Pune City Collectorate Campus, Maharashtra'
  );
  console.log('Twilio SMS Dispatch Result:', smsResult);
}

testDispatch().catch(console.error);
