import assert from 'assert';
import http from 'http';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

async function testEvents() {
  console.log('🧪 Testing Ticketmaster & Events Endpoints...');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Fetch events list
    const res = await fetch(`${baseUrl}/api/events`);
    assert.strictEqual(res.status, 200, 'GET /api/events should return 200');
    const json = await res.json();
    assert(Array.isArray(json.data), 'data should be an array of events');
    assert(json.data.length > 0, 'should return at least one event');

    const first = json.data[0];
    assert(first.id, 'event must have id');
    assert(first.title, 'event must have title');
    assert(first.venue !== undefined, 'event must have venue');
    assert(first.city !== undefined, 'event must have city');
    assert(first.date !== undefined, 'event must have date');
    assert(first.startDateTime !== undefined, 'event must have startDateTime');
    assert(first.imageUrl !== undefined, 'event must have imageUrl');
    assert(first.rsvped !== undefined, 'event must have rsvped boolean');
    assert(typeof first.friendsAttending === 'number', 'event must have friendsAttending count');
    console.log(`✅ GET /api/events returns ${json.data.length} normalized events`);

    // 2. Fetch calendar data
    const calRes = await fetch(`${baseUrl}/api/events/calendar?month=2026-10`);
    assert.strictEqual(calRes.status, 200, 'GET /api/events/calendar should return 200');
    const calJson = await calRes.json();
    assert(typeof calJson.data === 'object', 'calendar data must be an object map');
    console.log('✅ GET /api/events/calendar returns date-to-count map:', Object.keys(calJson.data).slice(0, 3));

    // 3. Search filter by keyword
    const searchRes = await fetch(`${baseUrl}/api/events?q=Coldplay`);
    const searchJson = await searchRes.json();
    assert(searchJson.data.some(e => e.title.includes('Coldplay')), 'Search query should filter events');
    console.log('✅ GET /api/events?q=Coldplay filters results correctly');

    // 4. Detail endpoint
    const detailRes = await fetch(`${baseUrl}/api/events/${first.id}`);
    assert.strictEqual(detailRes.status, 200, 'Detail endpoint should return 200');
    const detailJson = await detailRes.json();
    assert.strictEqual(detailJson.data.id, first.id, 'Detail ID should match requested ID');
    console.log('✅ GET /api/events/:id returns correct detail');

    console.log('🎉 All Event & Calendar tests passed!');
  } finally {
    server.close();
    await disconnectDB();
  }
}

testEvents().catch((err) => {
  console.error('❌ Events test failed:', err);
  process.exit(1);
});
