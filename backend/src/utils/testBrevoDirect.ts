import 'dotenv/config';

async function testBrevoDirect() {
  console.log('=== TESTING DIRECT BREVO API EMAIL DISPATCH ===');
  const apiKey = process.env.BREVO_API_KEY;
  console.log('BREVO_API_KEY present:', !!apiKey, apiKey ? `(starts with ${apiKey.slice(0, 10)}...)` : '');

  const payload = {
    sender: {
      name: 'MahaResilience Emergency Center',
      email: 'noreply@maharesilience.org',
    },
    to: [
      {
        email: 'sanskardhat6@gmail.com',
        name: 'Sanskar Dhat',
      },
    ],
    subject: '🚨 URGENT LIVE TEST: Brevo Emergency Email',
    htmlContent: '<h1>MahaResilience Emergency Alert Test</h1><p>This is a live test email from Brevo API.</p>',
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey || '',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('HTTP Status Code:', res.status, res.statusText);
    const data = await res.json();
    console.log('Brevo API Response Body:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('Fetch Error:', err);
  }
}

testBrevoDirect().catch(console.error);
