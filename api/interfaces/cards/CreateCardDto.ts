import { body } from "express-validator";
import { PRIORITIES, Priority } from "../../schemes/Card";

export interface CreateCardDto {
    title: string;
    description?: string;
    priority?: Priority;
    assigneeId?: number | null;
}

export const createCardValidation = [
    body("title").isString().trim().isLength({ min: 1, max: 255 }),
    body("description").optional().isString().isLength({ min: 0, max: 5000 }),
    body("priority").optional().isIn(PRIORITIES),
    body("assigneeId").optional({ nullable: true }).isInt({ min: 1, max: 2147483647 }).toInt(),
];
