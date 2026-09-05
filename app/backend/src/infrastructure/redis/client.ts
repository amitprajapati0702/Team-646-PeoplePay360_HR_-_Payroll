import { createClient } from 'redis';

import env  from '../../config/env.js';
import logger from '../../config/logger.js';

export type RedisClient = ReturnType<typeof createClient>;

export const redis: RedisClient = createClient({
  url: env.REDIS_URL,
});

redis.on('connect', () => {
  logger.info('Connecting to Redis...');
});

redis.on('ready', () => {
  logger.info('✅ Redis connected successfully.');
});

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

redis.on('error', (error) => {
  logger.error(error, 'Redis connection error.');
});

redis.on('end', () => {
  logger.info('Redis connection closed.');
});

export async function connectRedis(): Promise<void> {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis.isOpen) {
    await redis.quit();
  }
}

