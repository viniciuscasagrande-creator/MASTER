import { Request, Response, NextFunction } from 'express';
import { TraceContext } from './trace-context';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      requestId?: string;
    }
  }
}

export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || TraceContext.generateCorrelationId();
  const requestId = (req.headers['x-request-id'] as string) || TraceContext.generateRequestId();

  req.correlationId = correlationId;
  req.requestId = requestId;

  res.setHeader('X-Correlation-Id', correlationId);
  res.setHeader('X-Request-Id', requestId);

  const context = {
    correlationId,
    requestId,
    userId: (req as any).user?.id,
    userName: (req as any).user?.name,
    producerId: (req as any).user?.scope?.producerIds?.[0],
    module: req.baseUrl?.replace('/api/v1/', '') || 'core',
    operation: `${req.method} ${req.path}`,
    startTime: Date.now()
  };

  TraceContext.runWithContext(context, () => {
    next();
  });
};
