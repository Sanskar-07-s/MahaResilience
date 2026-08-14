import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import civicRoutes from './routes/civicRoutes.js';
import smsRoutes from './routes/smsRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import recaptchaRoutes from './routes/recaptcha.routes';
import aiRoutes from './routes/ai.routes';
import tourismRoutes from './routes/tourismRoutes';
import { errorHandler } from './middleware/error.js';

const app = express();

// Security headers (allow Google Auth & reCAPTCHA popups)
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://mahareilience.web.app',
  'https://mahareilience.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting (15 minutes, 200 requests)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request parsing
app.use(express.json());

// Root API Server welcome & health route
app.get('/', (req, res) => {
  res.json({
    name: 'MahaResilience API Server',
    status: 'ACTIVE',
    version: '1.0.0',
    frontend: process.env.FRONTEND_URL || 'https://mahareilience.web.app',
    health: '/health',
  });
});

// API route mappings
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/civic', civicRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recaptcha', recaptchaRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tourism', tourismRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling fallback
app.use(errorHandler);

export default app;
