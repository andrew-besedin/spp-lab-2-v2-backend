import { body, param } from 'express-validator';
import { ParamsDictionary } from 'express-serve-static-core';
import { UserRole } from '../../schemes/User';

export const ASSIGNABLE_ROLES = [UserRole.USER, UserRole.MODERATOR] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export interface UpdateUserRoleParams extends ParamsDictionary {
    id: string;
}

export interface UpdateUserRoleDto {
    role: AssignableRole;
}

export const updateUserRoleValidation = [
    param('id').isInt({ min: 1, max: 2147483647 }).toInt(),
    body('role').isIn(ASSIGNABLE_ROLES),
];
