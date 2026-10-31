import User, { UserRole } from '../schemes/User';
import { AssignableRole } from '../interfaces/admin/UpdateUserRoleDto';

export class UserNotFoundError extends Error {}
export class AdminRoleLockedError extends Error {}

const ADMIN_USER_ATTRIBUTES = ['id', 'username', 'displayName', 'avatarUrl', 'role', 'createdAt'];

class AdminService {
    listUsers() {
        return User.findAll({
            attributes: ADMIN_USER_ATTRIBUTES,
            order: [['username', 'ASC']],
        });
    }

    async updateUserRole(userId: number, role: AssignableRole) {
        const user = await User.findByPk(userId, { attributes: ADMIN_USER_ATTRIBUTES });

        if (!user) {
            throw new UserNotFoundError();
        }

        if (user.role === UserRole.ADMIN) {
            throw new AdminRoleLockedError();
        }

        return user.update({ role });
    }
}

const adminService = new AdminService();
export default adminService;
