import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import transactionRoutes from './routes/transactions.js';
import userRoutes from './routes/users.js';

// Connect to MongoDB
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Allowed origins for CORS (supports local development and Vercel production/preview deploys)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = allowedOrigins.some(allowed => 
      origin === allowed || origin.replace(/\/+$/, '') === allowed.replace(/\/+$/, '')
    );

    // Allow configured origins or any Vercel domain (*.vercel.app)
    if (isExplicitlyAllowed || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    return callback(new Error(`CORS Error: Origin ${origin} is not allowed`));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route (for service check)
app.get('/', (req, res) => {
  res.json({
    name: 'FinSplit API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);

// Root route (for health checking)
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Fallback Route for Undefined Endpoints
app.use((req, res, next) => {
  res.status(404).json({ message: `Endpoint ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Global Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`  Personal Finance Tracker Backend Running   `);
  console.log(`  Port: ${PORT}                               `);
  console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Database: MongoDB / Mongoose               `);
  console.log(`  Syntax: Native ES Modules (import/export)  `);
  console.log(`=============================================`);
});
