import { param } from "express-validator";
import { ParamsDictionary } from "express-serve-static-core";

export interface GetCardParams extends ParamsDictionary {
    id: string;
}

export const getCardValidation = [param("id").isInt().toInt()];
