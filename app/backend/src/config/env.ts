import dotenv from 'dotenv';
import {z} from "zod"
dotenv.config();

export const envschema = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    PORT: z.coerce.number().default(5000),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
})

const parsed = envschema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ INVALID ENV VARS:", parsed.error.issues.map(i => i.message));
    console.error(parsed.error.format())
    process.exit(1);
}

export const env = parsed.data