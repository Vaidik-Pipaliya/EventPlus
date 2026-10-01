import assert from 'assert';
import http from 'http';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

async function testAuth() {
  console.log('🧪 Testing Server Authentication (Local & JWT)...');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Register valid user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vaidik Pipaliya',
        email: 'vaidik@eventpulse.test',
        password: 'password123'
      })
    });
    assert.strictEqual(regRes.status, 201, 'Registration should return 201');
    const regData = await regRes.json();
    assert(regData.data.token, 'Registration must return a token');
    assert.strictEqual(regData.data.user.email, 'vaidik@eventpulse.test');
    assert.strictEqual(regData.data.user.name, 'Vaidik Pipaliya');
    console.log('✅ Registration returns 201 and valid token');

    const authToken = regData.data.token;

    // 2. Duplicate registration should return 409
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vaidik Pipaliya',
        email: 'vaidik@eventpulse.test',
        password: 'password123'
      })
    });
    assert.strictEqual(dupRes.status, 409, 'Duplicate email should return 409');
    console.log('✅ Duplicate registration rejected with 409');

    // 3. Short password rejected with 400
    const shortPassRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pass',
        email: 'short@eventpulse.test',
        password: '123'
      })
    });
    assert.strictEqual(shortPassRes.status, 400, 'Short password should return 400');
    console.log('✅ Short password rejected with 400');

    // 4. Login with correct credentials
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'vaidik@eventpulse.test',
        password: 'password123'
      })
    });
    assert.strictEqual(loginRes.status, 200, 'Login should return 200');
    const loginData = await loginRes.json();
    assert(loginData.data.token, 'Login must return a token');
    console.log('✅ Login with correct credentials returns 200 and token');

    // 5. Login with incorrect password rejected with 401
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'vaidik@eventpulse.test',
        password: 'wrongpassword'
      })
    });
    assert.strictEqual(badLoginRes.status, 401, 'Bad credentials should return 401');
    console.log('✅ Bad credentials rejected with 401');

    // 6. Access /api/auth/me with Bearer token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(meRes.status, 200, '/me should return 200 with valid token');
    const meData = await meRes.json();
    assert.strictEqual(meData.data.user.email, 'vaidik@eventpulse.test');
    console.log('✅ /api/auth/me returns current user');

    // 7. Access /api/auth/me without token -> 401
    const noAuthRes = await fetch(`${baseUrl}/api/auth/me`);
    assert.strictEqual(noAuthRes.status, 401, 'Unauthenticated request should return 401');
    console.log('✅ Unauthenticated /api/auth/me rejected with 401');

    // 8. Update profile (city)
    const updateRes = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ city: 'Bengaluru' })
    });
    assert.strictEqual(updateRes.status, 200, 'Profile update should return 200');
    const updateData = await updateRes.json();
    assert.strictEqual(updateData.data.user.city, 'Bengaluru');
    console.log('✅ Profile update successfully persisted');

    console.log('🎉 All Auth tests passed!');
  } finally {
    server.close();
    await disconnectDB();
  }
}

testAuth().catch((err) => {
  console.error('❌ Auth test failed:', err);
  process.exit(1);
});
