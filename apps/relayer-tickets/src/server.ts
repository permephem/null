import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import fastifyMetrics from "fastify-metrics";
import { CONFIG } from "./config.js";
import { registerRoutes } from "./routes.js";
import { setupSecurity } from "./security.js";
import { setupMetrics } from "./metrics.js";

async function main() {
  const app = Fastify({ logger: true });
  
  // CORS configuration
  await app.register(cors, { 
    origin: process.env.CORS_ORIGINS?.split(',') || true,
    credentials: true
  });
  
  // Rate limiting
  await app.register(rateLimit, { 
    max: 100, 
    timeWindow: "1 minute",
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: (request, context) => ({
      error: "RATE_LIMIT_EXCEEDED",
      message: `Rate limit exceeded, retry in ${context.after}`
    })
  });
  
  // Prometheus metrics
  await app.register(fastifyMetrics, { 
    endpoint: "/metrics",
    defaultMetrics: { enabled: true }
  });
  
  setupSecurity(app);
  setupMetrics(app);
  await registerRoutes(app);

  await app.listen({ port: CONFIG.PORT, host: "0.0.0.0" });
  app.log.info(`Relayer running on :${CONFIG.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
