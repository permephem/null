import Fastify from "fastify";
import { create as createIpfsClient } from "ipfs-http-client";

const app = Fastify({ logger: true });

const IPFS_API_URL = process.env.IPFS_API_URL || "http://localhost:5001";
const PINNING_JWT = process.env.PINNING_JWT || "";

const ipfs = createIpfsClient({ url: IPFS_API_URL });

app.addHook("onRequest", async (req, reply) => {
  const auth = req.headers.authorization || "";
  if (!PINNING_JWT) return; // open mode (dev)
  if (auth !== `Bearer ${PINNING_JWT}`) {
    return reply.code(401).send({ error: "UNAUTHORIZED" });
  }
});

app.get("/healthz", async () => ({ ok: true }));

app.post("/pin/json", async (req, reply) => {
  const body = await req.body as any;
  const data = Buffer.from(JSON.stringify(body));
  const { cid } = await ipfs.add(data, { pin: true, wrapWithDirectory: false });
  return reply.send({ uri: `ipfs://${cid.toString()}` });
});

app.post("/pin/buffer", async (req, reply) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req.raw) chunks.push(chunk as Buffer);
  const { cid } = await ipfs.add(Buffer.concat(chunks), { pin: true });
  return reply.send({ uri: `ipfs://${cid.toString()}` });
});

app.listen({ port: 8789, host: "0.0.0.0" })
  .then(() => app.log.info("Pinning adapter running on :8789"))
  .catch((e) => { app.log.error(e); process.exit(1); });
