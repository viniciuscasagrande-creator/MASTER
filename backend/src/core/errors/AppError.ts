export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, statusCode = 400, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '401 — Não autenticado. Token ausente ou expirado.') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = '403 — Você não possui permissão para realizar esta operação.',
    details?: { requiredPermission?: string; scopeIssue?: string; authorizedScope?: any }
  ) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = '404 — Recurso não encontrado.') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = '400 — Dados inválidos.', details?: any) {
    super(message, 400, details);
  }
}
