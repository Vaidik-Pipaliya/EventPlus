import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

const hasConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = hasConfig && getApps().length === 0
  ? initializeApp(firebaseConfig)
  : (getApps()[0] || null);

export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();

/**
 * Trigger Google Sign In popup and retrieve ID token
 */
export const triggerGoogleSignIn = async () => {
  if (!auth) {
    throw new Error('Firebase credentials not set in client/.env. Please configure VITE_FIREBASE_API_KEY or use email/password login.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
};
