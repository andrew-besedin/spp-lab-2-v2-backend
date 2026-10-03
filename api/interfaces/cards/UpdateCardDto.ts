import { body, param } from "express-validator";
import { ParamsDictionary } from "express-serve-static-core";
import { PRIORITIES, Priority } from "../../schemes/Card";
import { COLUMN_ORDER, ColumnStatus } from "../../utils/columns";

export interface UpdateCardParams extends ParamsDictionary {
    id: string;
}

export interface UpdateCardDto {
    title?: string;
    description?: string;
    priority?: Priority;
    assigneeId?: number | null;
    status?: ColumnStatus;
    position?: number;
}

export const updateCardValidation = [
    param("id").isInt({ min: 1, max: 2147483647 }).toInt(),
    body("title").optional().isString().trim().isLength({ min: 1, max: 255 }),
    body("description").optional().isString().isLength({ min: 0, max: 5000 }),
    body("priority").optional().isIn(PRIORITIES),
    body("assigneeId").optional({ nullable: true }).isInt({ min: 1, max: 2147483647 }).toInt(),
    body("status").optional().isIn(COLUMN_ORDER),
    body("position").optional().isInt({ min: 0, max: 2147483647 }).toInt(),
];
