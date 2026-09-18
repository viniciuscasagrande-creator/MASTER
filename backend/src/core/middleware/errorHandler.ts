import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    res.status(400).json({
      error: '400 — Dados inválidos.',
      statusCode: 400,
      details: err.flatten().fieldErrors,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
    return;
  }

  // 2. Custom Typed AppError
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
