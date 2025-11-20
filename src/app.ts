/**
 * Express application setup
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/orders', orderRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
});

export default app;
