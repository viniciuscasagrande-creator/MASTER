import { Router } from 'express';
import { ApprovalController } from './approval.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';

export const approvalRulesAdminRouter = Router();
approvalRulesAdminRouter.use(authenticate);

approvalRulesAdminRouter.get('/', requirePermission('aprovacoes.regra.visualizar'), ApprovalController.listRules);
approvalRulesAdminRouter.post('/', requirePermission('aprovacoes.regra.criar'), ApprovalController.createRule);
approvalRulesAdminRouter.put('/:id', requirePermission('aprovacoes.regra.editar'), ApprovalController.updateRule);
approvalRulesAdminRouter.post('/simulate', requirePermission('aprovacoes.regra.visualizar'), ApprovalController.simulateRule);

export const approvalThresholdsAdminRouter = Router();
approvalThresholdsAdminRouter.use(authenticate);

approvalThresholdsAdminRouter.get('/', requirePermission('aprovacoes.alcada.visualizar'), ApprovalController.listThresholds);
approvalThresholdsAdminRouter.post('/', requirePermission('aprovacoes.alcada.editar'), ApprovalController.saveThreshold);
