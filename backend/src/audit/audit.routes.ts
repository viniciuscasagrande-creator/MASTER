import { Router } from 'express';
import { AuditController } from './audit.controller';
import { requirePermission } from '../auth/auth.middleware';

const router = Router();

router.get('/logs', requirePermission('admin.auditoria.visualizar'), AuditController.listAuditLogs);
router.get('/security', requirePermission('admin.auditoria.visualizar'), AuditController.listSecurityLogs);

export default router;
