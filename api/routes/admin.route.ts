import express from 'express';
import adminController from '../controllers/admin.controller';
import middleware from '../middleware';
import { UserRole } from '../schemes/User';
import { updateUserRoleValidation } from '../interfaces/admin/UpdateUserRoleDto';

const router = express.Router();

router.use(middleware.requireAuth);
router.use(middleware.requireRole(UserRole.ADMIN));

router.get('/users', adminController.listUsers);
router.patch(
    '/users/:id/role',
    updateUserRoleValidation,
    middleware.validator,
    adminController.updateUserRole,
);

export default router;
