import { Request, Response } from 'express';
import { db } from '../core/database/index';

export class AuditController {
  public static listAuditLogs(req: Request, res: Response): void {
    res.json({
      total: db.auditLogs.length,
      logs: db.auditLogs
    });
  }

  public static listSecurityLogs(req: Request, res: Response): void {
    res.json({
      total: db.securityLogs.length,
      logs: db.securityLogs
    });
  }
}
