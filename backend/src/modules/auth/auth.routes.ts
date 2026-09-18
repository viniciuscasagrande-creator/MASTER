import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../core/middleware/authenticate';

const router = Router();

// Public auth endpoints
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protected auth endpoints
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);

// 2FA Security
router.post('/2fa/setup', authenticate, AuthController.setup2FA);
router.post('/2fa/verify', authenticate, AuthController.verify2FA);

// Sessions Management
router.get('/sessions', authenticate, AuthController.listSessions);
router.delete('/sessions/:id', authenticate, AuthController.revokeSession);

export default router;
