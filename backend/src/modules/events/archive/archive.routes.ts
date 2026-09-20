import { Router } from 'express';
import { ArchiveController } from './archive.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

// Archive event
router.post('/archive', requirePermission('eventos.arquivamento.arquivar'), ArchiveController.archiveEvent);

// Get archive details of specific event
router.get('/archive-record', requirePermission('eventos.arquivamento.visualizar'), ArchiveController.getArchiveRecord);

// List all archived events (global or event-scoped)
router.get('/archived-list', requirePermission('eventos.arquivamento.visualizar'), ArchiveController.listArchived);

export default router;
