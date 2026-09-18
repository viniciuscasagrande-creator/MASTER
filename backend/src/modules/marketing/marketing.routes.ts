import { Router, Request, Response } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// List marketing campaigns
router.get(
  '/campaigns',
  requirePermission('marketing.campanha.visualizar'),
  (req: Request, res: Response) => {
    res.status(200).json({
      total: 2,
      campaigns: [
        { id: 'cmp_1', name: 'Meta Ads - Festival de Inverno', roas: 4.8, status: 'ACTIVE' },
        { id: 'cmp_2', name: 'Google Ads - Broadway Curitiba', roas: 3.9, status: 'ACTIVE' }
      ]
    });
  }
);

export default router;
