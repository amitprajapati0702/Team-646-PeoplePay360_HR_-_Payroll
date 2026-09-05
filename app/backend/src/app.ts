import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import env from "./config/env.js";
import errorMiddleware from "./middleware/error.middleware.js";
import notFoundMiddleware from "./middleware/not-found.middleware.js";
import requestIdMiddleware from "./middleware/request-id.middleware.js";
import requestLoggerMiddleware from "./middleware/request-logger.middleware.js";
import type { Application } from "express";

const app: Application = express();

// Middleware (Security & Parsing)
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Request identification & logger (Runs before rate limiters to capture all traffic & 429 errors)
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

// API Base Check
app.get("/api/v1", (_req, res) => {
    res.json({
        success: true,
        message: "AuthForge Api is running",
    });
});

// Error Handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
