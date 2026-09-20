import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import userRoutes from './routes/userRoutes.js';

// 1. Load environment variables from .env file
dotenv.config();

// 2. Initialize MongoDB connection
connectDB();

// 3. Create Express application
const app = express();

// 4. Configure CORS
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 5. Request Body Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Test API Route
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'Ticket Management System API is running'
  });
});

// 7. Authentication, Event & Booking Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.send('Ticket Management System Backend API is active.');
});

// 8. Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// 8. Server Listener
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server listening in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`🔗 Test Endpoint: http://localhost:${PORT}/api/test`);
  });
}

export default app;
