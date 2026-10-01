import admin from 'firebase-admin';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let firebaseInitialized = false;

export const initFirebase = () => {
  if (firebaseInitialized) return;

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY
        })
      });
      firebaseInitialized = true;
      logger.info('Firebase Admin SDK initialized successfully');
    } catch (err) {
      logger.error('Failed to initialize Firebase Admin SDK', err);
    }
  } else {
    logger.warn('Firebase Admin credentials not set in environment. Google sign-in endpoint will require valid Firebase config.');
  }
};

export const verifyFirebaseToken = async (idToken) => {
  if (!firebaseInitialized) {
    initFirebase();
  }
  if (!firebaseInitialized) {
    throw new Error('FIREBASE_CONFIG_MISSING: Firebase credentials are not set on the server');
  }
  return await admin.auth().verifyIdToken(idToken);
};
