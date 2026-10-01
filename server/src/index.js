import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { registerChatSocket } from './sockets/chat.socket.js';

const server = http.createServer(app);

// Initialize Socket.IO instance
export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true
  }
});

// Register chat socket handlers
registerChatSocket(io);

// Attach socket reference to app for access in controllers if needed
app.set('io', io);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(env.PORT, () => {
      logger.info(`EventPulse Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`Health check available at http://localhost:${env.PORT}/health`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

export { server, app };
