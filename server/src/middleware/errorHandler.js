import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(code, message, statusCode = 400, details = []) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const errorHandler = (err, req, res, next) => {
  // If it's a known operational AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || []
      }
    });
  }

  // Handle Zod error
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors ? err.errors.map(e => ({ path: e.path.join('.'), message: e.message })) : []
      }
    });
  }

  // Handle Mongoose CastError or Duplicate Key
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: `Invalid format for field ${err.path}`,
        details: []
      }
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: `Resource with that ${field} already exists`,
        details: []
      }
    });
  }

  // Fallback for unhandled unexpected errors
  logger.error('Unhandled Server Error:', err);
  return res.status(err.status || 500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: []
    }
  });
};
