import Fastify from "fastify";
import cors from "@fastify/cors";
import { CONFIG } from "./config.js";
import { registerRoutes } from "./routes.js";

async function main() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await registerRoutes(app);

  await app.listen({ port: CONFIG.PORT, host: "0.0.0.0" });
  app.log.info(`Relayer running on :${CONFIG.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
