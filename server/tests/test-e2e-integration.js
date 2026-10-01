import assert from 'assert';
import { io as Client } from '../../client/node_modules/socket.io-client/build/esm/index.js';

async function runE2EVerification() {
  console.log('🚀 Running Full End-to-End System Verification against Live Servers...\n');

  const clientUrl = 'http://localhost:5173';
  const serverUrl = 'http://localhost:5000';

  // 1. Verify Client HTML is served by Vite
  const clientResp = await fetch(clientUrl);
  assert.strictEqual(clientResp.status, 200, 'Client dev server must respond with 200');
  const clientHtml = await clientResp.text();
  assert(clientHtml.includes('EventPulse'), 'Client HTML must include EventPulse title');
  assert(clientHtml.includes('IBM+Plex+Sans'), 'Client HTML must load IBM Plex Sans font');
  console.log('✅ Client dev server serving index.html correctly on http://localhost:5173');

  // 2. Verify Server Health
  const healthResp = await fetch(`${serverUrl}/health`);
  assert.strictEqual(healthResp.status, 200, 'Server health check must respond with 200');
  const healthData = await healthResp.json();
  assert.strictEqual(healthData.status, 'ok', 'Server health status must be ok');
  console.log('✅ Server running and healthy on http://localhost:5000/health');

  // 3. User Registration
  const testEmail = `e2e_user_${Date.now()}@eventpulse.test`;
  const regResp = await fetch(`${serverUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E Tester',
      email: testEmail,
      password: 'securePassword123'
    })
  });
  assert.strictEqual(regResp.status, 201, 'Registration must return 201');
  const { data: { token, user } } = await regResp.json();
  assert(token, 'Must return JWT');
  console.log('✅ User registered successfully:', user.email);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 4. Fetch Events & Calendar
  const eventsResp = await fetch(`${serverUrl}/api/events`, { headers: authHeaders });
  assert.strictEqual(eventsResp.status, 200);
  const eventsData = await eventsResp.json();
  assert(eventsData.data.length > 0, 'Must return events');
  const targetEvent = eventsData.data[0];
  console.log(`✅ Loaded ${eventsData.data.length} events from server. First event: "${targetEvent.title}"`);

  const calResp = await fetch(`${serverUrl}/api/events/calendar?month=2026-10`, { headers: authHeaders });
  assert.strictEqual(calResp.status, 200);
  const calData = await calResp.json();
  console.log('✅ Calendar density map loaded:', Object.keys(calData.data).length, 'dates with events');

  // 5. RSVP to First Event
  const rsvpResp = await fetch(`${serverUrl}/api/rsvps`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ eventId: targetEvent.id })
  });
  assert.strictEqual(rsvpResp.status, 201, 'RSVP must return 201');
  console.log('✅ Successfully RSVP\'d to event:', targetEvent.title);

  // 6. Set Reminder
  const remResp = await fetch(`${serverUrl}/api/reminders/${targetEvent.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ enabled: true, remindBefore: '1h' })
  });
  assert.strictEqual(remResp.status, 200, 'Reminder update must return 200');
  console.log('✅ Set 1-hour reminder for RSVP');

  // 7. Verify RSVP Dashboard shows event with reminder
  const dashResp = await fetch(`${serverUrl}/api/rsvps`, { headers: authHeaders });
  assert.strictEqual(dashResp.status, 200);
  const dashData = await dashResp.json();
  assert.strictEqual(dashData.data.upcoming.length, 1, 'Dashboard must have 1 upcoming RSVP');
  assert.strictEqual(dashData.data.upcoming[0].reminder.remindBefore, '1h');
  console.log('✅ RSVP Dashboard displays confirmed upcoming event with reminder setting');

  // 8. Generate Share Link
  const shareResp = await fetch(`${serverUrl}/api/share/${targetEvent.id}`, {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(shareResp.status, 201);
  const { data: shareData } = await shareResp.json();
  assert(shareData.token, 'Must return share token');
  console.log('✅ Generated unique share link token:', shareData.token);

  // 9. Simulate 3 Unique Incognito Visitors clicking the link
  const visitorIds = [`v1_${Date.now()}`, `v2_${Date.now()}`, `v3_${Date.now()}`];
  for (let i = 0; i < 3; i++) {
    const clickResp = await fetch(`${serverUrl}/api/share/${shareData.token}/click`, {
      headers: { Cookie: `visitorId=${visitorIds[i]}` }
    });
    assert.strictEqual(clickResp.status, 200);
    const clickJson = await clickResp.json();
    assert.strictEqual(clickJson.data.uniqueClicks, i + 1, `Unique clicks must equal ${i + 1}`);
  }
  console.log('✅ 3 distinct incognito visitors opened the link -> uniqueClicks = 3');

  // 10. Repeat click from visitor 1 does NOT change count
  const repeatResp = await fetch(`${serverUrl}/api/share/${shareData.token}/click`, {
    headers: { Cookie: `visitorId=${visitorIds[0]}` }
  });
  const repeatJson = await repeatResp.json();
  assert.strictEqual(repeatJson.data.uniqueClicks, 3, 'Repeat visitor must not increment count');
  console.log('✅ Repeat click by visitor 1 deduped -> count remains 3');

  // 11. Sharer opening own link does NOT change count
  const sharerClickResp = await fetch(`${serverUrl}/api/share/${shareData.token}/click`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Cookie: `visitorId=sharer_cookie`
    }
  });
  const sharerClickJson = await sharerClickResp.json();
  assert.strictEqual(sharerClickJson.data.uniqueClicks, 3, 'Sharer click must not increment count');
  console.log('✅ Sharer clicking own link ignored -> count remains 3');

  // 12. Verify event feed now shows friendsAttending = 3
  const feedEnrichedResp = await fetch(`${serverUrl}/api/events`, { headers: authHeaders });
  const feedEnrichedData = await feedEnrichedResp.json();
  const matchingEvent = feedEnrichedData.data.find(e => e.id === targetEvent.id);
  assert.strictEqual(matchingEvent.friendsAttending, 3, 'Event card must display friendsAttending = 3');
  assert.strictEqual(matchingEvent.rsvped, true, 'Event card must display rsvped = true');
  console.log('✅ Event card enriched with "friendsAttending: 3" and "rsvped: true"');

  // 13. Test Real-time Chat Gateway via WebSocket
  const socket = Client(serverUrl, {
    auth: { token },
    transports: ['websocket']
  });

  await new Promise((resolve) => socket.on('connect', resolve));
  console.log('✅ Socket connected with JWT auth');

  // Query "show my RSVPs"
  const rsvpQueryReply = await new Promise((resolve) => {
    socket.on('chat:reply', (data) => resolve(data));
    socket.emit('chat:message', { text: 'show my RSVPs' });
  });
  assert(rsvpQueryReply.text.includes('confirmed'), 'Reply should confirm RSVPs');
  assert.strictEqual(rsvpQueryReply.events.length, 1, 'Should return the confirmed RSVP in event cards');
  assert.strictEqual(rsvpQueryReply.events[0].id, targetEvent.id);
  console.log('✅ Chat Assistant answered "show my RSVPs" with event card:', rsvpQueryReply.events[0].title);

  socket.close();

  console.log('\n🎉 ALL 13 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY! 🚀\n');
}

runE2EVerification().catch((err) => {
  console.error('❌ E2E Verification failed:', err);
  process.exit(1);
});
