import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import eventRoutes from './routes/event.routes.js';

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS setup
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching CLIENT_URL
    if (!origin || origin === env.CLIENT_URL || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Dev-friendly permissive origin
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root & Health routes
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Auth & User routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

// Fallback 404 for undefined routes
app.use((req, res, next) => {
  next(new AppError('NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`, 404));
});

// Central error handler
app.use(errorHandler);

export default app;
