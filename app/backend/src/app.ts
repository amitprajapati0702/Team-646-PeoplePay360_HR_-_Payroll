import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

export const app = express();

// Security and utility middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root info route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    service: "PeoplePay360 HR & Payroll Backend API",
    version: "1.0.0",
    status: "online",
    endpoints: {
      health: "/health",
      apiStatus: "/api/status",
      summary: "/api/v1/summary"
    }
  });
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Service status endpoint
app.get("/api/status", (_req: Request, res: Response) => {
  res.status(200).json({
    name: "PeoplePay360 Microservice",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
});

// Payroll & HR sample summary endpoint
app.get("/api/v1/summary", (_req: Request, res: Response) => {
  res.status(200).json({
    totalEmployees: 142,
    activePayrollCycles: 1,
    currentPeriod: "September 2026",
    nextDisbursement: "2026-09-30",
    systemStatus: "Operational"
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "NotFound",
    message: "Requested endpoint does not exist."
  });
});

// Global error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "InternalServerError",
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
  });
});

export default app;
