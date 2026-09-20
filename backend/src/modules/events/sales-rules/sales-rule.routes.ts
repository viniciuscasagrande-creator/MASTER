import { Router } from 'express';
import { SalesRuleController } from './sales-rule.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('eventos.evento.visualizar'), SalesRuleController.listRules);
router.post('/', requirePermission('eventos.evento.editar'), SalesRuleController.createRule);
router.get('/:id', requirePermission('eventos.evento.visualizar'), SalesRuleController.getRule);
router.put('/:id', requirePermission('eventos.evento.editar'), SalesRuleController.updateRule);
router.delete('/:id', requirePermission('eventos.evento.editar'), SalesRuleController.deleteRule);

export default router;
