import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import handoverRoutes from './routes/handoverRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*', // Allow development frontend
    credentials: true,
  })
);
app.use(express.json());

// Request logger for development
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'Nexora FoodLoop Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/handovers', handoverRoutes);

// 404 Catch-all
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found.`,
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
async function startServer() {
  // Attempt DB connection (non-blocking, falls back immediately if Mongo not active)
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(` 🍽️  FoodLoop Backend running on http://localhost:${PORT}`);
    console.log(` 🔐 Auth API:    http://localhost:${PORT}/api/auth`);
    console.log(` ⚙️  Admin API:   http://localhost:${PORT}/api/admin`);
    console.log(` 📋 Listings:    http://localhost:${PORT}/api/listings`);
    console.log(` 🤝 Matches:     http://localhost:${PORT}/api/matches`);
    console.log(` 🛵 Handovers:   http://localhost:${PORT}/api/handovers`);
    console.log(` 🩺 Health:      http://localhost:${PORT}/api/health`);
    console.log(`=================================================\n`);
  });
}

startServer();

