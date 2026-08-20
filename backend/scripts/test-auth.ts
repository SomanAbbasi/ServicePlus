const API = 'http://localhost:3001/api';

async function test() {
  // 1. Send OTP
  console.log('1. Sending OTP...');
  const sendRes = await fetch(`${API}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+03079035614' }),
  });
  const sendBody = await sendRes.json();
  console.log('   Response:', JSON.stringify(sendBody));
  const devCode = sendBody.devCode;
  console.log('   Dev code:', devCode);

  // 2. Verify OTP
  console.log('\n2. Verifying OTP...');
  const verifyRes = await fetch(`${API}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+03079035614', code: devCode }),
  });
  const verifyBody = await verifyRes.json();
  console.log('   Keys:', Object.keys(verifyBody));
  console.log('   Profile:', JSON.stringify(verifyBody.profile, null, 2));
  const token = verifyBody.accessToken;

  // 3. Test /auth/me with token
  console.log('\n3. Testing /auth/me...');
  const meRes = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meBody = await meRes.json();
  console.log('   Status:', meRes.status);
  console.log('   Body:', JSON.stringify(meBody, null, 2));

  // 4. Test /auth/is-admin with token
  console.log('\n4. Testing /auth/is-admin...');
  const adminRes = await fetch(`${API}/auth/is-admin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const adminBody = await adminRes.json();
  console.log('   Status:', adminRes.status);
  console.log('   Body:', JSON.stringify(adminBody));
}

test().catch(console.error);
