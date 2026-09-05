
export interface HealthResponse {
    status: "healthy" | "unhealthy";
    environment: string;
    uptime: number;
    timestamp: string;
    database: "up" | "down",
    redis: "up" | "down"
}

