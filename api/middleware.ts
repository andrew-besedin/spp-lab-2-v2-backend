import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { verifyToken } from "./utils/jwt";
import User from "./schemes/User";

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

    requireAuth = async (req: Request, res: Response, next: NextFunction) => {
        const token = req.cookies?.token;
        const payload = token && verifyToken(token);

        if (!payload) {
            res.status(401).json({ success: false, data: "Unauthorized" });
            return;
        }

        const user = await User.findByPk(payload.id);

        if (!user) {
            res.status(401).json({ success: false, data: "Unauthorized" });
            return;
        }

        req.user = user;
        next();
    };
}

const middleware = new Middleware();
export default middleware;
