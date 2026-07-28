import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import transactionRoutes from './routes/transactions.js';

// Connect to MongoDB
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite standard development port
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets / logs directory if needed (e.g. for uploads or UI)
app.use('/data', express.static(path.join(__dirname, 'data')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/transactions', transactionRoutes);

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
