import { FastifyInstance } from "fastify";

// Simple in-memory metrics (use Prometheus client in production)
const metrics = {
  requests_total: 0,
  requests_by_endpoint: new Map<string, number>(),
  canon_anchors_total: 0,
  canon_anchor_failures: 0,
  verification_decisions: new Map<string, number>(),
  response_times: [] as number[],
  errors_total: 0
};

export function setupMetrics(app: FastifyInstance) {
  // Request counting
  app.addHook("onRequest", async (request) => {
    metrics.requests_total++;
    const endpoint = request.url.split("?")[0];
    metrics.requests_by_endpoint.set(endpoint, (metrics.requests_by_endpoint.get(endpoint) || 0) + 1);
  });

  // Response time tracking
  app.addHook("onResponse", async (request, reply) => {
    const responseTime = reply.getResponseTime();
    metrics.response_times.push(responseTime);
    
    // Keep only last 1000 response times
    if (metrics.response_times.length > 1000) {
      metrics.response_times = metrics.response_times.slice(-1000);
    }
  });

  // Error tracking
  app.addHook("onError", async (request, reply, error) => {
    metrics.errors_total++;
    console.error(`Error on ${request.url}:`, error);
  });

  // Metrics endpoint
  app.get("/metrics", async () => {
    const avgResponseTime = metrics.response_times.length > 0 
      ? metrics.response_times.reduce((a, b) => a + b, 0) / metrics.response_times.length 
      : 0;

    return {
      requests_total: metrics.requests_total,
      requests_by_endpoint: Object.fromEntries(metrics.requests_by_endpoint),
      canon_anchors_total: metrics.canon_anchors_total,
      canon_anchor_failures: metrics.canon_anchor_failures,
      verification_decisions: Object.fromEntries(metrics.verification_decisions),
      avg_response_time_ms: Math.round(avgResponseTime * 100) / 100,
      errors_total: metrics.errors_total
    };
  });
}

export function recordCanonAnchor(success: boolean) {
  if (success) {
    metrics.canon_anchors_total++;
  } else {
    metrics.canon_anchor_failures++;
  }
}

export function recordVerificationDecision(decision: string) {
  metrics.verification_decisions.set(decision, (metrics.verification_decisions.get(decision) || 0) + 1);
}
