import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class Middleware {
    validator(req: Request, res: Response, next: NextFunction) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(200).json({
                success: false,
                data: "Validation error",
                errors: errors.array(),
            });
        } else {
            next();
        }
    }
}

const middleware = new Middleware();
export default middleware;
