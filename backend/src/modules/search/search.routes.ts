import { Router } from 'express';
import { SearchController } from './search.controller';
import { authenticate } from '../../core/middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', SearchController.search);
router.get('/suggestions', SearchController.getSuggestions);
router.get('/recent', SearchController.getRecent);
router.get('/customers/:id', SearchController.getCustomer);
router.get('/orders/:id', SearchController.getOrder);

export default router;
