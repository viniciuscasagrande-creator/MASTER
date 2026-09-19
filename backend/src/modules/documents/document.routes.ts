import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';
import { DocumentController } from './document.controller';

const router = Router();

// Public signed download link (HMAC signature validated inside controller)
router.get('/download/signed', DocumentController.downloadSigned);

// Authenticated endpoints
router.use(authenticate);

// Document categories & requirements
router.get('/categories', DocumentController.listCategories);
router.post('/validate-requirements', DocumentController.validateRequirements);
router.post('/check-expiring', DocumentController.checkExpiring);

// Document CRUD & Upload
router.get('/', requirePermission('documentos.central.visualizar'), DocumentController.listDocuments);
router.post('/', requirePermission('documentos.arquivo.enviar'), DocumentController.uploadDocument);
router.post('/upload', requirePermission('documentos.arquivo.enviar'), DocumentController.uploadDocument);
router.post('/upload-multiple', requirePermission('documentos.arquivo.enviar'), DocumentController.uploadMultiple);

// Single Document Operations
router.get('/:id', requirePermission('documentos.arquivo.visualizar'), DocumentController.getById);
router.get('/:id/download', requirePermission('documentos.arquivo.baixar'), DocumentController.getDownloadUrl);
router.get('/:id/preview', requirePermission('documentos.arquivo.visualizar'), DocumentController.getPreview);
router.post('/:id/archive', requirePermission('documentos.arquivo.arquivar'), DocumentController.archive);
router.delete('/:id', requirePermission('documentos.arquivo.excluir'), DocumentController.softDelete);

// Versioning
router.get('/:id/versions', requirePermission('documentos.versao.visualizar'), DocumentController.listVersions);
router.post('/:id/versions', requirePermission('documentos.versao.criar'), DocumentController.createVersion);

// Links
router.get('/:id/links', requirePermission('documentos.arquivo.visualizar'), DocumentController.listLinks);
router.post('/:id/links', requirePermission('documentos.arquivo.enviar'), DocumentController.linkResource);
router.delete('/:id/links/:linkId', requirePermission('documentos.arquivo.excluir'), DocumentController.unlinkResource);

export default router;

// Dedicated sub-router for module resources: /resources/:resourceType/:resourceId/documents
export const resourceDocumentsRouter = Router({ mergeParams: true });
resourceDocumentsRouter.use(authenticate);
resourceDocumentsRouter.get('/:resourceType/:resourceId/documents', requirePermission('documentos.arquivo.visualizar'), DocumentController.getByResource);
resourceDocumentsRouter.post('/:resourceType/:resourceId/documents', requirePermission('documentos.arquivo.enviar'), (req, res, next) => {
  req.body.resourceType = req.params.resourceType;
  req.body.resourceId = req.params.resourceId;
  req.body.links = [{ resourceType: req.params.resourceType as any, resourceId: req.params.resourceId }];
  DocumentController.uploadDocument(req, res, next);
});
