import http from 'http';

import app from "./app.js"

import {env} from "./config/env.js"
import logger from './config/logger.js';
import { connectRedis,disconnectRedis, checkRedisHealth } from './infrastructure/redis/index.js';
import { connectDatabase,disconnectDatabase,checkDatabaseHealth } from './infrastructure/database/index.js';

async function bootstrap(): Promise<void> {
  try {
    logger.info('🚀 Starting AuthForge...');

    await connectDatabase();

    const databaseHealthy = await checkDatabaseHealth();

    if (!databaseHealthy) {
      throw new Error('Database health check failed.');
    }

    await connectRedis();

    const redisHealthy = await checkRedisHealth();

    if (!redisHealthy) {
      throw new Error('Redis health check failed.');
    }

    const server = http.createServer(app);

    server.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    registerShutdown(server);
  } catch (error) {
    logger.fatal(error, 'Application startup failed.');

    process.exit(1);
  }
}

function registerShutdown(server: http.Server): void {
  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received. Shutting down...`);

    server.close(async () => {
      try {
        await disconnectRedis();

        await disconnectDatabase();

        logger.info('Shutdown complete.');

        process.exit(0);
      } catch (error) {
        logger.fatal(error, 'Shutdown failed.');

        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

void bootstrap();