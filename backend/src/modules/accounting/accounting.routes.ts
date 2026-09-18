import { Router, Request, Response } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// DRE Contábil
router.get(
  '/dre',
  requirePermission('contabilidade.dre.visualizar'),
  (req: Request, res: Response) => {
    res.status(200).json({
      period: '2026-Q1',
      grossRevenue: 12548500,
      netRevenue: 11042680,
      ebitda: 3820400
    });
  }
);

export default router;
