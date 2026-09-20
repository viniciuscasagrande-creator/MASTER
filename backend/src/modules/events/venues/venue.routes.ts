import { Router } from 'express';
import { VenueController } from './venue.controller';
import { VenueSectionController } from '../venue-sections/venue-section.controller';
import { VenueAccessPointController } from '../venue-access-points/venue-access-point.controller';
import { VenueMapController } from '../venue-maps/venue-map.controller';
import { authenticate } from '../../../core/middleware/authenticate';
import { contextMiddleware } from '../../context/context.middleware';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);
router.use(contextMiddleware);

// --- 1. Resumo e KPIs de Locais ---
router.get('/summary', requirePermission('eventos.locais.visualizar'), VenueController.getVenueSummary);

// --- 2. Listagem de Locais ---
router.get('/', requirePermission('eventos.locais.visualizar'), VenueController.listVenues);

// --- 3. Criar Local ---
router.post('/', requirePermission('eventos.locais.criar'), VenueController.createVenue);

// --- 4. Detalhes de um Local ---
router.get('/:id', requirePermission('eventos.locais.visualizar'), VenueController.getVenue);

// --- 5. Atualizar Local ---
router.put('/:id', requirePermission('eventos.locais.editar'), VenueController.updateVenue);

// --- 6. Arquivar Local ---
router.post('/:id/archive', requirePermission('eventos.locais.arquivar'), VenueController.archiveVenue);

// --- 7. Setores Físicos do Local ---
router.get('/:venueId/sections', requirePermission('eventos.locais.visualizar'), VenueSectionController.listSections);
router.post('/:venueId/sections', requirePermission('eventos.locais.editar'), VenueSectionController.createSection);
router.put('/sections/:id', requirePermission('eventos.locais.editar'), VenueSectionController.updateSection);
router.delete('/sections/:id', requirePermission('eventos.locais.editar'), VenueSectionController.deleteSection);

// --- 8. Acessos e Portões ---
router.get('/:venueId/access-points', requirePermission('eventos.acessos.visualizar'), VenueAccessPointController.listAccessPoints);
router.post('/:venueId/access-points', requirePermission('eventos.acessos.gerenciar'), VenueAccessPointController.createAccessPoint);
router.put('/access-points/:id', requirePermission('eventos.acessos.gerenciar'), VenueAccessPointController.updateAccessPoint);
router.delete('/access-points/:id', requirePermission('eventos.acessos.gerenciar'), VenueAccessPointController.deleteAccessPoint);

// --- 9. Mapas e Versões ---
router.get('/:venueId/maps', requirePermission('eventos.mapas.visualizar'), VenueMapController.listMaps);
router.post('/:venueId/maps', requirePermission('eventos.mapas.criar'), VenueMapController.createMap);
router.get('/maps/:id', requirePermission('eventos.mapas.visualizar'), VenueMapController.getMapWithVersion);
router.put('/map-versions/:id/layout', requirePermission('eventos.mapas.editar'), VenueMapController.saveMapLayout);
router.post('/map-versions/:id/publish', requirePermission('eventos.mapas.publicar'), VenueMapController.publishMapVersion);
router.post('/map-versions/:id/duplicate', requirePermission('eventos.mapas.criar'), VenueMapController.duplicateMapVersion);
router.patch('/map-versions/:id/seats/bulk', requirePermission('eventos.assentos.editar'), VenueMapController.bulkUpdateSeats);

export default router;
