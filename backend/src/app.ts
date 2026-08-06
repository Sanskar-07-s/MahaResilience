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
import { errorHandler } from './middleware/error.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: '*', // Allow all origins for the developer environment
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

// API route mappings
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/civic', civicRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling fallback
app.use(errorHandler);

export default app;
