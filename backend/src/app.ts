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

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'Disk Interno Core Node.js Real',
    version: '1.1.5.1',
    phase: '1.3.11.1.5',
    commit: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || 'f08744d',
    activeModules: [
      'overview',
      'events',
      'commercial',
      'event-support',
      'sac',
      'refunds',
      'finance',
      'accounting',
      'marketing',
      'remarketing',
      'admin',
      'settings'
    ],
    timestamp: new Date().toISOString()
  });
});

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Primary API v1 Router
app.use('/api/v1', apiV1Routes);
app.use('/api', apiV1Routes);

// Servir Frontend SPA (React / Vite) diretamente pelo Express
const possiblePaths = [
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), 'apps/web/dist'),
  path.resolve(__dirname, '../../dist'),
  path.resolve(__dirname, '../../apps/web/dist')
];
const clientPath = possiblePaths.find(p => fs.existsSync(path.join(p, 'index.html')));

if (clientPath) {
  app.use(express.static(clientPath));
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Endpoint não encontrado' });
    }
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Centralized error handler

app.use(errorHandler);

export default app;
