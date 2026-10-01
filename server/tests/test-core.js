import assert from 'assert';
import http from 'http';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

async function testServerCore() {
  console.log('🧪 Testing Server Core & Health...');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    // 1. Test /health
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.strictEqual(res.status, 200, 'Health check should return 200');
    const data = await res.json();
    assert.strictEqual(data.status, 'ok', 'Status should be ok');
    console.log('✅ /health returns status: ok');

    // 2. Test 404 handler and error response shape
    const notFoundRes = await fetch(`http://127.0.0.1:${port}/api/nonexistent-route-for-testing`);
    assert.strictEqual(notFoundRes.status, 404, 'Non-existent route should return 404');
    const notFoundData = await notFoundRes.json();
    assert(notFoundData.error, 'Response must have error object');
    assert.strictEqual(notFoundData.error.code, 'NOT_FOUND', 'Error code should be NOT_FOUND');
    console.log('✅ 404 response shape matches { error: { code, message, details } }');

    console.log('🎉 Server core tests passed!');
  } finally {
    server.close();
    await disconnectDB();
  }
}

testServerCore().catch((err) => {
  console.error('❌ Server core test failed:', err);
  process.exit(1);
});
