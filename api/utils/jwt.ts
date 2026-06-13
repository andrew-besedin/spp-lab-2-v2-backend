import jwt from "jsonwebtoken";
import envVars from "./envVars";

export interface JwtPayload {
    id: number;
}

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, envVars().JWT_SECRET, { expiresIn: "1d" });
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, envVars().JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}
