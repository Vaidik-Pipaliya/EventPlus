import assert from 'assert';
import http from 'http';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

async function testShareAndFriendsAttending() {
  console.log('🧪 Testing Share Link & Unique Click Tracking...');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Register User A (Sharer)
    const userARes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sharer Alice',
        email: 'alice@eventpulse.test',
        password: 'password123'
      })
    });
    const { data: { token: tokenA } } = await userARes.json();
    const headersA = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    };

    const eventId = 'tm_fallback_002';

    // 2. Share without RSVP should fail with 400
    const failShareRes = await fetch(`${baseUrl}/api/share/${eventId}`, {
      method: 'POST',
      headers: headersA
    });
    assert.strictEqual(failShareRes.status, 400, 'Share link without RSVP should return 400');
    console.log('✅ Share link generation without RSVP properly rejected');

    // 3. Alice RSVPs to event
    await fetch(`${baseUrl}/api/rsvps`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ eventId })
    });

    // 4. Generate Share Link
    const shareRes1 = await fetch(`${baseUrl}/api/share/${eventId}`, {
      method: 'POST',
      headers: headersA
    });
    assert.strictEqual(shareRes1.status, 201, 'Share link generation should return 201');
    const { data: shareData1 } = await shareRes1.json();
    assert(shareData1.token, 'Must return a token');
    const shareToken = shareData1.token;

    // 5. Test idempotency: generating again returns the same token
    const shareRes2 = await fetch(`${baseUrl}/api/share/${eventId}`, {
      method: 'POST',
      headers: headersA
    });
    const { data: shareData2 } = await shareRes2.json();
    assert.strictEqual(shareData1.token, shareData2.token, 'Same sharer + event must return the same share token');
    console.log('✅ Share link generation is idempotent');

    // 6. Sharer clicks own link -> ignored (count remains 0)
    const sharerClickRes = await fetch(`${baseUrl}/api/share/${shareToken}/click`, {
      headers: {
        Authorization: `Bearer ${tokenA}`,
        Cookie: 'visitorId=alice_own_cookie'
      }
    });
    const sharerClickJson = await sharerClickRes.json();
    assert.strictEqual(sharerClickJson.data.uniqueClicks, 0, 'Sharer click must NOT be counted');
    console.log('✅ Sharer clicking own link is ignored (uniqueClicks = 0)');

    // 7. Visitor 1 clicks link -> count 1
    const v1Res = await fetch(`${baseUrl}/api/share/${shareToken}/click`, {
      headers: { Cookie: 'visitorId=visitor_001' }
    });
    const v1Json = await v1Res.json();
    assert.strictEqual(v1Json.data.uniqueClicks, 1, 'First unique visitor should increase count to 1');

    // 8. Visitor 1 clicks link AGAIN -> count still 1
    const v1RepeatRes = await fetch(`${baseUrl}/api/share/${shareToken}/click`, {
      headers: { Cookie: 'visitorId=visitor_001' }
    });
    const v1RepeatJson = await v1RepeatRes.json();
    assert.strictEqual(v1RepeatJson.data.uniqueClicks, 1, 'Repeat click by same visitor must NOT increase count');
    console.log('✅ Repeat click by same visitor deduped (uniqueClicks = 1)');

    // 9. Visitor 2 clicks link -> count 2
    const v2Res = await fetch(`${baseUrl}/api/share/${shareToken}/click`, {
      headers: { Cookie: 'visitorId=visitor_002' }
    });
    const v2Json = await v2Res.json();
    assert.strictEqual(v2Json.data.uniqueClicks, 2, 'Second unique visitor should increase count to 2');

    // 10. Visitor 3 clicks link -> count 3
    const v3Res = await fetch(`${baseUrl}/api/share/${shareToken}/click`, {
      headers: { Cookie: 'visitorId=visitor_003' }
    });
    const v3Json = await v3Res.json();
    assert.strictEqual(v3Json.data.uniqueClicks, 3, 'Third unique visitor should increase count to 3');
    console.log('✅ 3 distinct visitors recorded exactly 3 unique clicks');

    // 11. Check stats endpoint for Alice
    const statsRes = await fetch(`${baseUrl}/api/share/${eventId}/stats`, {
      headers: headersA
    });
    const statsJson = await statsRes.json();
    assert.strictEqual(statsJson.data.uniqueClicks, 3, 'Stats endpoint should report 3 unique clicks');

    // 12. Check GET /api/events for Alice: friendsAttending should be 3
    const eventsRes = await fetch(`${baseUrl}/api/events`, {
      headers: headersA
    });
    const eventsJson = await eventsRes.json();
    const aliceEvent = eventsJson.data.find(e => e.id === eventId);
    assert.strictEqual(aliceEvent.friendsAttending, 3, 'Event card must show friendsAttending = 3');
    assert.strictEqual(aliceEvent.rsvped, true, 'Event card must show rsvped = true');
    console.log('✅ Event card for Alice displays friendsAttending = 3');

    console.log('🎉 All Share & Unique Click tests passed!');
  } finally {
    server.close();
    await disconnectDB();
  }
}

testShareAndFriendsAttending().catch((err) => {
  console.error('❌ Share test failed:', err);
  process.exit(1);
});
