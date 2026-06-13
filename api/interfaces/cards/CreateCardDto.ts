import { body } from "express-validator";
import { PRIORITIES, Priority } from "../../schemes/Card";

export interface CreateCardDto {
    title: string;
    description?: string;
    priority?: Priority;
    assigneeId?: number | null;
}

export const createCardValidation = [
    body("title").isString().trim().notEmpty(),
    body("description").optional().isString(),
    body("priority").optional().isIn(PRIORITIES),
    body("assigneeId").optional({ nullable: true }).isInt().toInt(),
];
