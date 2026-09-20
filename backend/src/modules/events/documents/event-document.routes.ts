import { Router } from 'express';
import { EventDocumentController } from './event-document.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('eventos.documentos.visualizar'), EventDocumentController.listRequirements);
router.post('/', requirePermission('eventos.documentos.gerenciar'), EventDocumentController.createRequirement);
router.post('/upload', requirePermission('eventos.documentos.upload'), EventDocumentController.uploadDocument);
router.patch('/:requirementId/status', requirePermission('eventos.documentos.validar'), EventDocumentController.updateRequirementStatus);

export default router;
