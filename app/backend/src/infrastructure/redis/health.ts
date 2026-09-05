import { redis } from './client.js';
import logger from '../../config/logger.js';

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const response = await redis.ping();

    return response === 'PONG';
  } catch (error) {
    logger.error(error, 'Redis health check failed.');
    return false;
  }
}