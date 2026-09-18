import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from './auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authMiddleware, AuthController.me);
router.post('/logout', authMiddleware, AuthController.logout);

export default router;
