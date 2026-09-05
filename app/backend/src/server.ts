import { createServer } from "node:http";
import { app } from "./app.js";

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const server = createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`[PeoplePay360 Backend] Server listening at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log(`[PeoplePay360 Backend] Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n[PeoplePay360 Backend] Received ${signal}. Starting graceful shutdown...`);

  const forceExitTimeout = setTimeout(() => {
    console.error("[PeoplePay360 Backend] Forcefully shutting down due to timeout.");
    process.exit(1);
  }, 10000);

  server.close((err) => {
    clearTimeout(forceExitTimeout);
    if (err) {
      console.error("[PeoplePay360 Backend] Error during server close:", err);
      process.exit(1);
    }
    console.log("[PeoplePay360 Backend] HTTP server closed gracefully. Goodbye!");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
