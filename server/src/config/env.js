import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventpulse',
  JWT_SECRET: process.env.JWT_SECRET || 'eventpulse_jwt_secret_default_key_2026_dev',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  TICKETMASTER_API_KEY: process.env.TICKETMASTER_API_KEY || '',
  DEFAULT_COUNTRY_CODE: process.env.DEFAULT_COUNTRY_CODE || 'US',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : '',
  CHAT_LLM_ENABLED: process.env.CHAT_LLM_ENABLED === 'true'
};
