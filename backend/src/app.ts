import express, { Request, Response } from 'express';
import cors from 'cors';
import apiV1Routes from './routes/index';
import { errorHandler } from './core/middleware/errorHandler';
import { EventBus } from './events/event-bus';
import { NotificationService } from './modules/notifications/notification.service';

// Connect notification engine to event bus
EventBus.subscribeAll(NotificationService.processDomainEvent);

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root & Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'Disk Interno Core Node.js Real',
    version: '1.1.5.1',
    message: 'Backend API Disk Interno PDT operacional',
    healthCheck: '/api/health',
    endpoints: '/api/v1',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'Disk Interno Core Node.js Real',
    version: '1.1.5.1',
    timestamp: new Date().toISOString()
  });
});

// Primary API v1 Router
app.use('/api/v1', apiV1Routes);
app.use('/api', apiV1Routes);

// Centralized error handler

app.use(errorHandler);

export default app;
