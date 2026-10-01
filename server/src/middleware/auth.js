import { verifyAppToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { AppError } from './errorHandler.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 'Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAppToken(token);
    if (!decoded || !decoded.sub) {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'User associated with token no longer exists', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAppToken(token);
      if (decoded && decoded.sub) {
        const user = await User.findById(decoded.sub);
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  } catch (err) {
    // optionalAuth never blocks the request
    next();
  }
};
