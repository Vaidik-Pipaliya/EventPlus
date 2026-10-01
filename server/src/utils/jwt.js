import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const JWT_EXPIRES_IN = '7d';

/**
 * Sign an application JWT with 7-day expiry and sub: userId payload
 */
export const signAppToken = (userId) => {
  return jwt.sign({ sub: userId.toString() }, env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Verify and decode an application JWT
 */
export const verifyAppToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};
