import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    PGDATABASE: z.string().min(1),
    PORT: z.coerce.number().default(3000),
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
    };
}

export default envVars;
