import Card from '../schemes/Card';
import User, { UserRole } from '../schemes/User';

const CARD_MANAGER_ROLES = [UserRole.MODERATOR, UserRole.ADMIN];

export function canManageCard(user: User, card: Card): boolean {
    return (
        CARD_MANAGER_ROLES.includes(user.role) ||
        card.creatorId === user.id ||
        card.assigneeId === user.id
    );
}
