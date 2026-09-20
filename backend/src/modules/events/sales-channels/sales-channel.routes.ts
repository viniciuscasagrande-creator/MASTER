import { Router } from 'express';
import { SalesChannelController } from './sales-channel.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

// Canais disponíveis no sistema
router.get('/available', requirePermission('eventos.canais.visualizar'), SalesChannelController.listAvailableChannels);

// Canais configurados para o evento
router.get('/', requirePermission('eventos.canais.visualizar'), SalesChannelController.getEventChannels);
router.post('/configure', requirePermission('eventos.canais.gerenciar'), SalesChannelController.configureChannel);
router.patch('/:salesChannelId/toggle', requirePermission('eventos.canais.gerenciar'), SalesChannelController.toggleChannel);
router.post('/:eventSalesChannelId/allocations', requirePermission('eventos.canais.alocar'), SalesChannelController.setChannelAllocation);

// Pontos de venda físicos
router.get('/points/list', requirePermission('eventos.canais.visualizar'), SalesChannelController.listSalesPoints);
router.post('/points', requirePermission('eventos.canais.gerenciar'), SalesChannelController.createSalesPoint);

// Parceiros e Afiliados
router.get('/partners/list', requirePermission('eventos.canais.visualizar'), SalesChannelController.listSalesPartners);
router.post('/partners', requirePermission('eventos.canais.gerenciar'), SalesChannelController.createSalesPartner);

export default router;
