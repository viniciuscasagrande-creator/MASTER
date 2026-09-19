import { TraceContext } from '../tracing/trace-context';
import { LogSanitizerService } from './log-sanitizer.service';
import { LogLevel } from '../../../../shared/types/index';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  operation?: string;
  message: string;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  producerId?: string;
  eventId?: string;
  errorCode?: string;
  durationMs?: number;
  data?: any;
}

export class LoggerService {
  private serviceName: string;
  private minLevel: LogLevel = 'INFO';

  private static levelWeights: Record<LogLevel, number> = {
    TRACE: 10,
    DEBUG: 20,
    INFO: 30,
    WARN: 40,
    ERROR: 50,
    FATAL: 60
  };

  constructor(serviceName: string = 'core-service', minLevel?: LogLevel) {
    this.serviceName = serviceName;
    if (minLevel) this.minLevel = minLevel;
  }

  public setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  public shouldLog(level: LogLevel): boolean {
    return LoggerService.levelWeights[level] >= LoggerService.levelWeights[this.minLevel];
  }

  public log(level: LogLevel, message: string, data?: any, errorCode?: string): StructuredLogEntry | null {
    if (!this.shouldLog(level)) {
      return null;
    }

    const ctx = TraceContext.getContext();
    const sanitizedData = data !== undefined ? LogSanitizerService.sanitize(data) : undefined;

    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      operation: ctx?.operation,
      message,
      correlationId: ctx?.correlationId || TraceContext.getCorrelationId(),
      requestId: ctx?.requestId || TraceContext.getRequestId(),
      userId: ctx?.userId,
      producerId: ctx?.producerId,
      eventId: ctx?.eventId,
      errorCode,
      data: sanitizedData
    };

    // Saída estruturada padronizada em formato JSON
    const serialized = JSON.stringify(entry);
    if (level === 'ERROR' || level === 'FATAL') {
      console.error(serialized);
    } else if (level === 'WARN') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }

    return entry;
  }

  public trace(message: string, data?: any): StructuredLogEntry | null {
    return this.log('TRACE', message, data);
  }

  public debug(message: string, data?: any): StructuredLogEntry | null {
    return this.log('DEBUG', message, data);
  }

  public info(message: string, data?: any): StructuredLogEntry | null {
    return this.log('INFO', message, data);
  }

  public warn(message: string, data?: any, errorCode?: string): StructuredLogEntry | null {
    return this.log('WARN', message, data, errorCode);
  }

  public error(message: string, data?: any, errorCode?: string): StructuredLogEntry | null {
    return this.log('ERROR', message, data, errorCode);
  }

  public fatal(message: string, data?: any, errorCode?: string): StructuredLogEntry | null {
    return this.log('FATAL', message, data, errorCode);
  }
}

export const logger = new LoggerService('disk-interno');
