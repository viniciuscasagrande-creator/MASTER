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

export class EventConcurrencyError extends AppError {
  constructor(message = 'Este evento foi atualizado por outro usuário. Há uma versão mais recente disponível.') {
    super(message, 409);
    this.name = 'EventConcurrencyError';
  }
}

export class EventValidationError extends AppError {
  constructor(message = 'Dados inválidos para a configuração do evento.') {
    super(message, 400);
    this.name = 'EventValidationError';
  }
}
