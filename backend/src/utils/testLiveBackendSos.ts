import fetch from 'node-fetch';

async function testLiveSosEndpoint() {
  console.log('=== TESTING LIVE RENDER BACKEND SOS ENDPOINT ===');
  const url = 'https://maharesilience.onrender.com/api/sms/sos';

  const payload = {
    latitude: 18.5204,
    longitude: 73.8567,
    location: '18.5204, 73.8567',
    district: 'Pune',
    address: 'Pune Collectorate Campus, Maharashtra',
    reporter: 'Sanskar Dhat (Live Test)',
    email: 'sanskardhat6@gmail.com',
    emergencyContacts: ['+919209966816'],
  };

  console.log(`Sending POST to ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log(`HTTP Status Code: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log('Response Body:', text);
  } catch (err: any) {
    console.error('Network / HTTP Request Error:', err);
  }
}

testLiveSosEndpoint().catch(console.error);
