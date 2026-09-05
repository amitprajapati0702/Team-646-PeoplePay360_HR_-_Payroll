import { env } from "../../config/env.js";
import { checkDatabaseHealth } from "../../infrastructure/database/health.js";
import { checkRedisHealth } from "../../infrastructure/redis/health.js";

import type { HealthResponse } from "./health.types.js";


export class HealthService {
    async getHealth(): Promise<HealthResponse> {
        const [databasehealthy, redishealthy] = await Promise.all([
            checkDatabaseHealth().then(() => "up").catch(() => "down"),
            checkRedisHealth().then(() => "up").catch(() => "down")
        ])
        return {
            status: databasehealthy && redishealthy ? "healthy" : "unhealthy",
            environment: env.NODE_ENV,

            uptime: Math.floor(process.uptime()),

            timestamp: new Date().toISOString(),

            database: databasehealthy ? 'up' : 'down',

            redis: redishealthy ? 'up' : 'down',
        }
    }
}


export const healthservice = new HealthService()