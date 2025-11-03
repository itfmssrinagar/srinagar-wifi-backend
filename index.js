import dotenv from 'dotenv';
// Load environment variables FIRST before importing other modules
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routers/authRoute.js';
import connectDB from './config/db.js';

connectDB();

const app = express();

const PORT= process.env.PORT || 5000;

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})
