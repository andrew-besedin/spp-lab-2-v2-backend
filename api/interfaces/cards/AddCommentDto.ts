import { body, param } from "express-validator";
import { ParamsDictionary } from "express-serve-static-core";

export interface AddCommentParams extends ParamsDictionary {
    id: string;
}

export interface AddCommentDto {
    body: string;
}

export const addCommentValidation = [
    param("id").isInt({ min: 1, max: 2147483647 }).toInt(),
    body("body").isString().trim().isLength({ min: 1, max: 2000 }),
];
