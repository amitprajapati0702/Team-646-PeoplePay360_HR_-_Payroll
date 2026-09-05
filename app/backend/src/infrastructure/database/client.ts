import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import {env} from '../../config/env.js';
import logger from '../../config/logger.js';


import * as schema from './schema/index.js';

export const sql = postgres(env.DATABASE_URL, {
    max: 20,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: true,
});

export const db = drizzle(sql, { schema });

export async function connectDatabase(): Promise<void> {
    try {
        await sql`SELECT 1`;
        logger.info("✅ PostgreSQL connected successfully.");
    } catch (error) {
        logger.fatal(error, "Unable to connect to PostgreSQL.");
        throw error;
    }
}

export async function disconnectDatabase(): Promise<void> {
    await sql.end();

    logger.info('PostgreSQL connection closed.');
}

