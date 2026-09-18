import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
      details: err.details,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
    return;
  }

  console.error('[Unhandled Internal Error]:', err);

  res.status(500).json({
    error: '500 — Erro interno do servidor.',
    statusCode: 500,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
};
