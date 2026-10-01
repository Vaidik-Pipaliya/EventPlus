/**
 * Simple structured console logger with timestamp and level.
 */
const getTimestamp = () => new Date().toISOString();

export const logger = {
  info: (msg, meta) => {
    console.log(`[${getTimestamp()}] [INFO] ${msg}`, meta ? meta : '');
  },
  warn: (msg, meta) => {
    console.warn(`[${getTimestamp()}] [WARN] ${msg}`, meta ? meta : '');
  },
  error: (msg, err) => {
    console.error(`[${getTimestamp()}] [ERROR] ${msg}`, err ? err : '');
  },
  debug: (msg, meta) => {
    if (process.env.DEBUG === 'true') {
      console.log(`[${getTimestamp()}] [DEBUG] ${msg}`, meta ? meta : '');
    }
  }
};
