import { AppError } from '../../../core/errors/AppError';

export class EventNotFoundError extends AppError {
  constructor(message = 'Evento não encontrado.') {
    super(message, 404);
    this.name = 'EventNotFoundError';
  }
}

export class EventAccessDeniedError extends AppError {
  constructor(message = 'Você não possui permissão para acessar este evento.') {
    super(message, 403);
    this.name = 'EventAccessDeniedError';
  }
}

export class EventInvalidStatusError extends AppError {
  constructor(message = 'Status do evento inválido para a operação solicitada.') {
    super(message, 400);
    this.name = 'EventInvalidStatusError';
  }
}
