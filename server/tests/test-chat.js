import assert from 'assert';
import http from 'http';
import { Server } from 'socket.io';
import { io as Client } from '../../client/node_modules/socket.io-client/build/esm/index.js';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { registerChatSocket } from '../src/sockets/chat.socket.js';

async function testChatGateway() {
  console.log('🧪 Testing Real-Time Chat Gateway & Intent Parsing...');
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  registerChatSocket(io);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Register test user to get JWT
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chat User',
        email: 'chatuser@eventpulse.test',
        password: 'password123'
      })
    });
    const { data: { token } } = await regRes.json();

    // 2. Test unauthenticated connection fails
    const badSocket = Client(baseUrl, {
      auth: { token: 'invalid_jwt_token' },
      transports: ['websocket'],
      reconnection: false
    });

    const failedAuth = await new Promise((resolve) => {
      badSocket.on('connect_error', (err) => {
        resolve(true);
      });
      badSocket.on('connect', () => {
        resolve(false);
      });
    });
    badSocket.close();
    assert.strictEqual(failedAuth, true, 'Unauthenticated socket should be rejected');
    console.log('✅ Socket handshake rejects invalid token');

    // 3. Authenticated socket connection succeeds
    const socket = Client(baseUrl, {
      auth: { token },
      transports: ['websocket']
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
    });
    console.log('✅ Socket connected successfully with valid JWT');

    // 4. Test "events this weekend" intent
    const replyPromise1 = new Promise((resolve) => {
      let typingSeen = false;
      socket.on('chat:typing', (data) => {
        if (data.isTyping) typingSeen = true;
      });
      socket.on('chat:reply', (data) => {
        resolve({ typingSeen, data });
      });
    });

    socket.emit('chat:message', { text: 'events this weekend' });
    const reply1 = await replyPromise1;
    assert(reply1.typingSeen, 'Typing indicator must be emitted before reply');
    assert(reply1.data.text, 'Reply must contain message text');
    console.log('✅ Intent "events this weekend" answered with typing indicator and reply');

    // 5. Test "help" intent
    socket.off('chat:reply');
    const replyPromise2 = new Promise((resolve) => {
      socket.on('chat:reply', (data) => resolve(data));
    });
    socket.emit('chat:message', { text: 'help' });
    const reply2 = await replyPromise2;
    assert(reply2.text.includes('Events this weekend'), 'Help text must explain capabilities');
    console.log('✅ Intent "help" returns command capabilities');

    socket.close();
    console.log('🎉 All Chat Gateway tests passed!');
  } finally {
    io.close();
    server.close();
    await disconnectDB();
  }
}

testChatGateway().catch((err) => {
  console.error('❌ Chat test failed:', err);
  process.exit(1);
});
