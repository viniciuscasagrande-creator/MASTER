import { db } from '../core/database/index';
export { authMiddleware, requirePermission, requireScope, requireAnyPermission } from './auth.middleware';

// Backward compatibility export
export const MOCK_USERS_DB = db.users;
