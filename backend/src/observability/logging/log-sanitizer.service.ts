import { AuditSanitizerService } from '../audit/audit-sanitizer.service';

export class LogSanitizerService {
  public static sanitize(data: any): any {
    return AuditSanitizerService.sanitize(data);
  }
}
