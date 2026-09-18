import { Router, Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

router.get('/logs', requirePermission('admin.auditoria.visualizar'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await AuditService.listLogs();
    res.status(200).json({ total: logs.length, logs });
  } catch (err) {
    next(err);
  }
});

export default router;
