import { body, param } from "express-validator";
import { ParamsDictionary } from "express-serve-static-core";

export interface AddCommentParams extends ParamsDictionary {
    id: string;
}

export interface AddCommentDto {
    body: string;
}

export const addCommentValidation = [
    param("id").isInt().toInt(),
    body("body").isString().trim().notEmpty(),
];
