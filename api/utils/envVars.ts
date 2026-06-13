import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    PGDATABASE: z.string().min(1),
    PORT: z.coerce.number().default(3000),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_CALLBACK_URL: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    FRONTEND_URL: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

const env = parsed.data;

function envVars() {
    return {
        PORT: env.PORT,
        GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
        GITHUB_CALLBACK_URL: env.GITHUB_CALLBACK_URL,
        JWT_SECRET: env.JWT_SECRET,
        FRONTEND_URL: env.FRONTEND_URL,
    };
}

export default envVars;
