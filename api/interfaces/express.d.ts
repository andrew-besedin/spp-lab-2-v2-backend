import User from "../schemes/User";

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export {};
