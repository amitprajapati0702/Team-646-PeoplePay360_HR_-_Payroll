import dotenv from 'dotenv';
import {z} from "zod"
dotenv.config();

const envschema = z.object({
    NODE_ENV: z.enum(["development", "production"]),
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    PORT: z.number().default(5000),
    CORS_ORIGIN: z.string(),
})

const env = envschema.parse(process.env);

export default env;