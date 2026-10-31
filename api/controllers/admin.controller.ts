import adminService, { AdminRoleLockedError, UserNotFoundError } from '../services/admin.service';
import { UpdateUserRoleDto, UpdateUserRoleParams } from '../interfaces/admin/UpdateUserRoleDto';
import { tryCatch } from '../utils/utils';

class AdminController {
    listUsers = tryCatch(async (req, res) => {
        const users = await adminService.listUsers();
        res.status(200).json({ success: true, data: users });
    });

    updateUserRole = tryCatch<UpdateUserRoleParams, unknown, UpdateUserRoleDto>(
        async (req, res) => {
            try {
                const user = await adminService.updateUserRole(
                    Number(req.params.id),
                    req.body.role,
                );
                res.status(200).json({ success: true, data: user });
            } catch (err) {
                if (err instanceof UserNotFoundError) {
                    res.status(404).json({ success: false, data: 'USER_NOT_FOUND' });
                    return;
                }

                if (err instanceof AdminRoleLockedError) {
                    res.status(200).json({ success: false, data: 'ADMIN_ROLE_LOCKED' });
                    return;
                }

                throw err;
            }
        },
    );
}

const adminController = new AdminController();
export default adminController;
