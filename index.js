import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';

import authRoutes from './routers/authRoute.js';
import userRoutes from './routers/userRoute.js';
import planRoutes from './routers/planRoute.js';
import sessionRoutes from './routers/sessionRoute.js';
import orderRoutes from './routers/orderRoute.js';
import connectDB from './config/db.js';

import { initSocket } from './services/socketService.js';
import ruckusRoutes from "./routers/ruckusRoute.js";


connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ruckus', ruckusRoutes);

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// -------------------- HTTP + Socket.IO --------------------
const server = http.createServer(app);

// Initialize Socket.IO service
initSocket(server);


// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.IO`);
});
