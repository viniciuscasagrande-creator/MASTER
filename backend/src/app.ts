import express, { Request, Response } from 'express';
import cors from 'cors';
import { authMiddleware } from './auth/auth.middleware';
import authRoutes from './auth/auth.routes';
import usersRoutes from './users/users.routes';
import eventsRoutes from './events/events.routes';
import ordersRoutes from './orders/orders.routes';
import financeRoutes from './finance/finance.routes';
import auditRoutes from './audit/audit.routes';
import { errorHandler } from './core/middleware/errorHandler';
import { db } from './core/database/index';

const app = express();

// Basic middlewares
app.use(cors());
app.use(express.json());

// Global Auth Context Middleware (extracts Bearer token or x-user-id and attaches req.user)
app.use(authMiddleware);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'Disk Interno Modular Monolith Backend',
    version: '1.1.5',
    activeUsersCount: db.users.length,
    activeEventsCount: db.events.length,
    activeSessionsCount: db.activeSessions.size,
    timestamp: new Date().toISOString()
  });
});

// Primary API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/users', usersRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/audit', auditRoutes);

// Compatibility aliases for legacy/frontend direct endpoints
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', usersRoutes);
app.get('/api/admin/roles', (req: Request, res: Response) => {
  res.redirect(307, '/api/v1/admin/users/roles/catalog');
});
app.get('/api/admin/permissions', (req: Request, res: Response) => {
  res.redirect(307, '/api/v1/admin/users/permissions/catalog');
});

// Centralized error handler
app.use(errorHandler);

export default app;
