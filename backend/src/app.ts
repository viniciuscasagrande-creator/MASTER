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
app.use(express.json());

// Health Check
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

// Compatibility aliases for direct endpoints
app.use('/api/auth', apiV1Routes);
app.use('/api/admin', apiV1Routes);

// Centralized error handler
app.use(errorHandler);

export default app;
