import { verifyAppToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { handleChatMessage } from '../services/chat.service.js';
import { logger } from '../utils/logger.js';

export const registerChatSocket = (io) => {
  // Authentication middleware for Socket.IO connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAppToken(token);
      if (!decoded || !decoded.sub) {
        return next(new Error('Invalid or expired token'));
      }

      const user = await User.findById(decoded.sub);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.error('Socket authentication error:', err.message);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const userRoom = `user_${userId}`;
    socket.join(userRoom);
    logger.info(`User ${socket.user.name} (${userId}) connected to chat socket`);

    socket.on('chat:message', async (payload) => {
      const text = typeof payload === 'string' ? payload : payload?.text;
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return socket.emit('chat:reply', {
          text: 'Please type a valid message.',
          events: []
        });
      }

      // 1. Emit typing indicator
      socket.emit('chat:typing', { isTyping: true });

      try {
        // Small delay to simulate human-like response cadence
        await new Promise((resolve) => setTimeout(resolve, 200));

        // 2. Handle intent and build response
        const response = await handleChatMessage(userId, text);

        // 3. Stop typing indicator and reply
        socket.emit('chat:typing', { isTyping: false });
        socket.emit('chat:reply', response);
      } catch (err) {
        logger.error('Error handling chat message:', err);
        socket.emit('chat:typing', { isTyping: false });
        socket.emit('chat:reply', {
          text: 'Sorry, I encountered an error searching for events. Please try again.',
          events: []
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`User ${socket.user.name} disconnected from chat`);
    });
  });
};
