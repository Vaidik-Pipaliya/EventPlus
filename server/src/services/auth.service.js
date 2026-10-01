import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signAppToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import { verifyFirebaseToken } from '../config/firebase.js';

/**
 * Register a new local user with email & password
 */
export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('EMAIL_EXISTS', 'An account with this email already exists', 409);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    provider: 'local'
  });

  const token = signAppToken(user._id);
  return {
    token,
    user: user.toSafeObject()
  };
};

/**
 * Authenticate local user with email & password
 */
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.passwordHash) {
    // Generic error message for security
    throw new AppError('INVALID_CREDENTIALS', 'Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid credentials', 401);
  }

  const token = signAppToken(user._id);
  return {
    token,
    user: user.toSafeObject()
  };
};

/**
 * Authenticate or register user via Firebase Google ID token
 */
export const loginWithGoogle = async ({ idToken }) => {
  let decodedToken;
  try {
    decodedToken = await verifyFirebaseToken(idToken);
  } catch (err) {
    throw new AppError('INVALID_TOKEN', `Failed to verify Google token: ${err.message}`, 401);
  }

  const { email, name, picture, uid } = decodedToken;
  if (!email) {
    throw new AppError('INVALID_TOKEN', 'Google account must have an associated email address', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    // Account linking: if email exists (e.g. registered locally), link with Google firebaseUid
    user.firebaseUid = uid;
    if (!user.avatarUrl && picture) {
      user.avatarUrl = picture;
    }
    await user.save();
  } else {
    // New user created via Google OAuth
    user = await User.create({
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      provider: 'google',
      firebaseUid: uid,
      avatarUrl: picture || ''
    });
  }

  const token = signAppToken(user._id);
  return {
    token,
    user: user.toSafeObject()
  };
};

/**
 * Update authenticated user profile fields
 */
export const updateUserProfile = async (userId, { name, city }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  if (name !== undefined) user.name = name.trim();
  if (city !== undefined) user.city = city.trim();

  await user.save();
  return user.toSafeObject();
};
