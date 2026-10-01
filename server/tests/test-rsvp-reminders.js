import assert from 'assert';
import http from 'http';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

async function testRsvpAndReminders() {
  console.log('🧪 Testing RSVPs and Reminders Endpoints...');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Register a test user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'RSVP Tester',
        email: 'rsvptester@eventpulse.test',
        password: 'password123'
      })
    });
    const { data: { token } } = await regRes.json();
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    // 2. Create an RSVP
    const eventId = 'tm_fallback_001';
    const rsvpRes = await fetch(`${baseUrl}/api/rsvps`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ eventId })
    });
    assert.strictEqual(rsvpRes.status, 201, 'POST /api/rsvps should return 201');
    const rsvpData = await rsvpRes.json();
    assert.strictEqual(rsvpData.data.status, 'going');
    assert.strictEqual(rsvpData.data.eventId, eventId);
    assert(rsvpData.data.event.title, 'RSVP must store snapshot title');
    console.log('✅ POST /api/rsvps creates RSVP with snapshot');

    // 3. Verify event list enriches rsvped: true
    const eventListRes = await fetch(`${baseUrl}/api/events`, {
      headers: authHeaders
    });
    const eventListJson = await eventListRes.json();
    const eventInList = eventListJson.data.find(e => e.id === eventId);
    assert.strictEqual(eventInList.rsvped, true, 'Event list should reflect rsvped: true for current user');
    console.log('✅ Event feed correctly enriched with rsvped: true');

    // 4. Set reminder
    const remRes = await fetch(`${baseUrl}/api/reminders/${eventId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ enabled: true, remindBefore: '1h' })
    });
    assert.strictEqual(remRes.status, 200, 'PUT /api/reminders should return 200');
    const remData = await remRes.json();
    assert.strictEqual(remData.data.remindBefore, '1h');
    assert.strictEqual(remData.data.enabled, true);
    console.log('✅ PUT /api/reminders/:eventId updates reminder');

    // 5. Check dashboard lists it with reminder info
    const dashRes = await fetch(`${baseUrl}/api/rsvps`, {
      headers: authHeaders
    });
    assert.strictEqual(dashRes.status, 200);
    const dashJson = await dashRes.json();
    assert.strictEqual(dashJson.data.all.length, 1);
    assert.strictEqual(dashJson.data.all[0].reminder.remindBefore, '1h');
    console.log('✅ GET /api/rsvps returns dashboard with reminder attached');

    // 6. Cancel RSVP
    const cancelRes = await fetch(`${baseUrl}/api/rsvps/${eventId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert.strictEqual(cancelRes.status, 200, 'DELETE /api/rsvps should return 200');
    console.log('✅ DELETE /api/rsvps/:eventId cancels RSVP');

    // 7. Verify dashboard active RSVPs count is now 0
    const dashAfterCancel = await fetch(`${baseUrl}/api/rsvps`, {
      headers: authHeaders
    });
    const dashAfterJson = await dashAfterCancel.json();
    assert.strictEqual(dashAfterJson.data.all.length, 0, 'Active RSVPs should be 0 after cancellation');
    console.log('✅ Cancelled RSVP successfully removed from active dashboard');

    console.log('🎉 All RSVP & Reminder tests passed!');
  } finally {
    server.close();
    await disconnectDB();
  }
}

testRsvpAndReminders().catch((err) => {
  console.error('❌ RSVP/Reminder test failed:', err);
  process.exit(1);
});
