import { sql } from './client.js';
import logger from '../../config/logger.js';

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await sql`SELECT 1`;

    return true;
  } catch (error) {
    logger.error(error, "PostgreSQL health check failed.");
    return false;
  }
}