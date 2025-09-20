import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { CONFIG } from "./config.js";

// In-memory API key store (use database in production)
const apiKeys = new Set<string>([
  "demo-api-key-123",
  "venue-abc-key-456",
  "venue-xyz-key-789"
]);

// Session token store (use Redis in production)
const sessionTokens = new Set<string>();

export function setupSecurity(app: FastifyInstance) {
  // API Key authentication for /tickets/* endpoints
  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for health and metrics endpoints
    if (request.url.startsWith("/healthz") || request.url.startsWith("/metrics")) {
      return;
    }

    if (request.url.startsWith("/tickets/")) {
      const apiKey = request.headers["x-api-key"] as string;
      if (!apiKey || !isValidApiKey(apiKey)) {
        return reply.code(401).send({ 
          error: "UNAUTHORIZED",
          message: "Valid API key required"
        });
      }
    }
  });

  // Replay protection: check nonce/session for QR payloads
  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.url === "/tickets/verify") {
      const body = request.body as any;
      if (body.ticketQrPayload) {
        // Extract session token from QR payload and validate
        const sessionToken = extractSessionToken(body.ticketQrPayload);
        if (!sessionToken || !isValidSessionToken(sessionToken)) {
          return reply.code(400).send({ 
            error: "INVALID_SESSION_TOKEN",
            message: "Valid session token required"
          });
        }
      }
    }
  });

  // Request logging for security monitoring
  app.addHook("onRequest", async (request: FastifyRequest) => {
    const { method, url, ip, headers } = request;
    app.log.info({
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
      apiKey: headers['x-api-key'] ? 'present' : 'missing'
    }, 'Request received');
  });

  // Response logging for security monitoring
  app.addHook("onResponse", async (request: FastifyRequest, reply: FastifyReply) => {
    const { method, url, ip } = request;
    const { statusCode, responseTime } = reply;
    
    if (statusCode >= 400) {
      app.log.warn({
        method,
        url,
        ip,
        statusCode,
        responseTime
      }, 'Error response');
    }
  });
}

function isValidApiKey(apiKey: string): boolean {
  // In production, validate against venue database with proper hashing
  // For now, use simple set lookup
  return apiKeys.has(apiKey);
}

function extractSessionToken(qrPayload: string): string | null {
  // Extract session token from QR payload format: "TICKET:<commit>:<session>"
  const parts = qrPayload.split(":");
  return parts.length >= 3 ? parts[2] : null;
}

function isValidSessionToken(sessionToken: string): boolean {
  // In production, validate session token against database with TTL
  // For now, use simple set lookup
  return sessionTokens.has(sessionToken);
}

// Generate session tokens for testing
export function generateSessionToken(): string {
  const token = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionTokens.add(token);
  
  // Clean up expired tokens (simple TTL simulation)
  setTimeout(() => {
    sessionTokens.delete(token);
  }, 30 * 60 * 1000); // 30 minutes
  
  return token;
}

// Add API key for testing
export function addApiKey(apiKey: string): void {
  apiKeys.add(apiKey);
}

// Remove API key
export function removeApiKey(apiKey: string): void {
  apiKeys.delete(apiKey);
}
