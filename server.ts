import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import connectDB from './server/config/db.js';
import { seedDatabaseIfEmpty } from './server/seed/seedData.js';
import authRoutes from './server/routes/authRoutes.js';
import eventRoutes from './server/routes/eventRoutes.js';
import bookingRoutes from './server/routes/bookingRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import { errorHandler } from './server/middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Connect database and seed initial sample data
  try {
    await connectDB();
    await seedDatabaseIfEmpty();
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Ticket Management System' });
  });

  app.get('/api/test', (req, res) => {
    res.status(200).json({
      message: 'Ticket Management System API is running',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/users', userRoutes);

  // Error handling middleware for API routes
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    errorHandler(err, req, res, next);
  });

  // Vite middleware for development / Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
  });
}

startServer();
