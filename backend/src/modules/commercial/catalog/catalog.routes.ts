import { Router } from 'express';
import { CatalogController } from './catalog.controller';
import { authenticate } from '../../../core/middleware/authenticate';
import { requireAnyPermission } from '../../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// 1. Métricas e visualizações agregadas
router.get(
  '/metrics',
  requireAnyPermission(['comercial.catalogo.visualizar', 'comercial.propostas.visualizar', 'admin.sistema.configurar']),
  CatalogController.getMetrics
);

router.get(
  '/plans',
  requireAnyPermission(['comercial.catalogo.visualizar', 'comercial.propostas.visualizar', 'admin.sistema.configurar']),
  CatalogController.listPlans
);

router.get(
  '/packages',
  requireAnyPermission(['comercial.catalogo.visualizar', 'comercial.propostas.visualizar', 'admin.sistema.configurar']),
  CatalogController.listPackages
);

router.get(
  '/services',
  requireAnyPermission(['comercial.catalogo.visualizar', 'comercial.propostas.visualizar', 'admin.sistema.configurar']),
  CatalogController.listServices
);

router.get(
  '/categories',
  requireAnyPermission(['comercial.catalogo.visualizar', 'comercial.propostas.visualizar', 'admin.sistema.configurar']),
  CatalogController.listCategories
);

// 2. Recursos técnicos (features desacopladas)
router.get(
  '/features',
  requireAnyPermission(['comercial.catalogo.visualizar', 'admin.sistema.configurar']),
  CatalogController.listFeatures
);

router.post(
  '/features',
  requireAnyPermission(['comercial.catalogo.criar', 'admin.sistema.configurar']),
  CatalogController.createFeature
);

// 3. Ofertas comerciais (Planos, Pacotes, Serviços, Adicionais)
router.get(
  '/offerings',
  requireAnyPermission(['comercial.catalogo.visualizar', 'comercial.propostas.visualizar', 'admin.sistema.configurar']),
  CatalogController.listOfferings
);

router.post(
  '/offerings',
  requireAnyPermission(['comercial.catalogo.criar', 'admin.sistema.configurar']),
  CatalogController.createOffering
);

router.get(
  '/offerings/:id',
  requireAnyPermission(['comercial.catalogo.visualizar', 'comercial.propostas.visualizar', 'admin.sistema.configurar']),
  CatalogController.getOfferingById
);

router.put(
  '/offerings/:id',
  requireAnyPermission(['comercial.catalogo.editar', 'admin.sistema.configurar']),
  CatalogController.updateOffering
);

router.post(
  '/offerings/:id/discontinue',
  requireAnyPermission(['comercial.catalogo.editar', 'admin.sistema.configurar']),
  CatalogController.discontinueOffering
);

router.get(
  '/offerings/:id/impact',
  requireAnyPermission(['comercial.catalogo.visualizar', 'comercial.catalogo.editar', 'admin.sistema.configurar']),
  CatalogController.getOfferingImpact
);

router.get(
  '/offerings/:id/terms',
  requireAnyPermission(['comercial.catalogo.visualizar', 'comercial.propostas.visualizar', 'admin.sistema.configurar']),
  CatalogController.resolveOfferingTerms
);

// 4. Versionamento de ofertas
router.get(
  '/offerings/:id/versions',
  requireAnyPermission(['comercial.catalogo.visualizar', 'admin.sistema.configurar']),
  CatalogController.listOfferingVersions
);

router.post(
  '/offerings/:id/versions',
  requireAnyPermission(['comercial.catalogo.versionar', 'admin.sistema.configurar']),
  CatalogController.createDraftVersion
);

router.post(
  '/versions/:versionId/publish',
  requireAnyPermission(['comercial.catalogo.publicar', 'admin.sistema.configurar']),
  CatalogController.publishVersion
);

export default router;
