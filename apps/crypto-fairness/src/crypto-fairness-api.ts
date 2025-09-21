import Fastify, { FastifyInstance } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { 
  ProbeRequestSchema, 
  FairnessAnalysisSchema,
  AttestationSchema,
  EventTypeEnum,
  ChainEnum,
  ViolationTypeEnum,
  SeverityEnum,
  FairnessScoreEnum
} from './types';
import { cryptoFairnessConfig } from './config';
import { ProbeOrchestrator } from './probe-orchestrator';
import { MempoolMonitor } from './mempool-monitor';
import { FairnessAnalyzer } from './fairness-analyzer';

// Type definitions
type ProbeRequestType = Static<typeof ProbeRequestSchema>;
type FairnessAnalysisType = Static<typeof FairnessAnalysisSchema>;
type AttestationType = Static<typeof AttestationSchema>;

// Additional schemas for API endpoints
const CreateProbeSchema = Type.Object({
  eventId: Type.String(),
  eventType: EventTypeEnum,
  chain: ChainEnum,
  contractAddress: Type.String({ format: 'ethereum-address' }),
  startTime: Type.Optional(Type.String({ format: 'date-time' })),
  endTime: Type.Optional(Type.String({ format: 'date-time' })),
  probeConfig: Type.Object({
    mempoolMonitoring: Type.Boolean(),
    mevDetection: Type.Boolean(),
    botDetection: Type.Boolean(),
    timingAnalysis: Type.Boolean(),
    sampleSize: Type.Number({ minimum: 1, maximum: 1000 })
  })
});

const GetProbeStatusSchema = Type.Object({
  probeId: Type.String()
});

const GetEventAnalysisSchema = Type.Object({
  eventId: Type.String()
});

const CreateAttestationSchema = Type.Object({
  eventId: Type.String(),
  fairnessAnalysis: FairnessAnalysisSchema,
  attestorAddress: Type.String({ format: 'ethereum-address' }),
  nullTokenPayment: Type.Object({
    amount: Type.String(),
    transactionHash: Type.String()
  })
});

const GetFairnessIndexSchema = Type.Object({
  chain: Type.Optional(ChainEnum),
  eventType: Type.Optional(EventTypeEnum),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  offset: Type.Optional(Type.Number({ minimum: 0 }))
});

const GetViolationStatsSchema = Type.Object({
  chain: Type.Optional(ChainEnum),
  violationType: Type.Optional(ViolationTypeEnum),
  severity: Type.Optional(SeverityEnum),
  timeRange: Type.Optional(Type.Object({
    start: Type.String({ format: 'date-time' }),
    end: Type.String({ format: 'date-time' })
  }))
});

// Type definitions
type CreateProbeType = Static<typeof CreateProbeSchema>;
type GetProbeStatusType = Static<typeof GetProbeStatusSchema>;
type GetEventAnalysisType = Static<typeof GetEventAnalysisSchema>;
type CreateAttestationType = Static<typeof CreateAttestationSchema>;
type GetFairnessIndexType = Static<typeof GetFairnessIndexSchema>;
type GetViolationStatsType = Static<typeof GetViolationStatsSchema>;

// Fastify server setup
const server: FastifyInstance = Fastify({
  logger: {
    level: cryptoFairnessConfig.logging.level,
    transport: cryptoFairnessConfig.logging.format === 'pretty' ? {
      target: 'pino-pretty'
    } : undefined
  }
});

// Initialize services
const probeOrchestrator = new ProbeOrchestrator();
const mempoolMonitor = new MempoolMonitor();
const fairnessAnalyzer = new FairnessAnalyzer();

// In-memory storage (in production, use PostgreSQL)
const eventAnalyses = new Map<string, FairnessAnalysisType>();
const attestations = new Map<string, AttestationType>();
const fairnessIndex = new Map<string, any>();

// API Key authentication middleware
server.addHook('preHandler', async (request, reply) => {
  const apiKey = request.headers['x-api-key'] as string;
  
  if (!apiKey || apiKey !== cryptoFairnessConfig.security.apiKeySecret) {
    return reply.status(401).send({ 
      error: 'Unauthorized',
      message: 'Valid API key required'
    });
  }
});

// Health check endpoint
server.get('/healthz', async (request, reply) => {
  const mempoolStats = mempoolMonitor.getMempoolStats();
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      mempool: mempoolStats.isMonitoring ? 'active' : 'inactive',
      probe: 'active',
      analyzer: 'active'
    },
    stats: mempoolStats
  };
});

// Create a new probe
server.post<{ Body: CreateProbeType }>(
  '/probe/create',
  { schema: { body: CreateProbeSchema } },
  async (request, reply) => {
    if (!Value.Check(CreateProbeSchema, request.body)) {
      return reply.status(400).send({ 
        error: 'Invalid request body',
        details: [...Value.Errors(CreateProbeSchema, request.body)]
      });
    }

    const probeRequest: ProbeRequestType = request.body;
    
    try {
      const probeId = await probeOrchestrator.createProbe(probeRequest);
      
      return {
        success: true,
        probeId,
        message: 'Probe created successfully',
        estimatedDuration: '5-10 minutes'
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({
        error: 'Failed to create probe',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get probe status
server.get<{ Params: GetProbeStatusType }>(
  '/probe/:probeId/status',
  { schema: { params: GetProbeStatusSchema } },
  async (request, reply) => {
    const { probeId } = request.params;
    
    const result = probeOrchestrator.getProbeStatus(probeId);
    
    if (!result) {
      return reply.status(404).send({
        error: 'Probe not found',
        message: `No probe found with ID: ${probeId}`
      });
    }
    
    return {
      probeId: result.probeId,
      eventId: result.eventId,
      status: result.success ? 'completed' : 'failed',
      success: result.success,
      duration: result.duration,
      timestamp: result.timestamp,
      nodeLocation: result.nodeLocation,
      errors: result.errors,
      data: result.data
    };
  }
);

// Get event analysis
server.get<{ Params: GetEventAnalysisType }>(
  '/analysis/:eventId',
  { schema: { params: GetEventAnalysisSchema } },
  async (request, reply) => {
    const { eventId } = request.params;
    
    const analysis = eventAnalyses.get(eventId);
    
    if (!analysis) {
      return reply.status(404).send({
        error: 'Analysis not found',
        message: `No analysis found for event: ${eventId}`
      });
    }
    
    return analysis;
  }
);

// Create attestation
server.post<{ Body: CreateAttestationType }>(
  '/attestation/create',
  { schema: { body: CreateAttestationSchema } },
  async (request, reply) => {
    if (!Value.Check(CreateAttestationSchema, request.body)) {
      return reply.status(400).send({ 
        error: 'Invalid request body',
        details: [...Value.Errors(CreateAttestationSchema, request.body)]
      });
    }

    const { eventId, fairnessAnalysis, attestorAddress, nullTokenPayment } = request.body;
    
    try {
      // Generate attestation ID
      const attestationId = `attestation_${eventId}_${Date.now()}`;
      
      // Create signature (simplified)
      const signature = `0x${'0'.repeat(130)}`; // In production, use actual signature
      
      // Create canon entry
      const canonEntry = {
        seal: `0x${'0'.repeat(64)}`, // In production, use actual seal
        maskId: `mask_${eventId}`,
        oblivionMarker: JSON.stringify({
          eventId,
          score: fairnessAnalysis.overallScore,
          violations: fairnessAnalysis.violations.length,
          timestamp: new Date().toISOString()
        }),
        inscribedAt: new Date().toISOString()
      };
      
      const attestation: AttestationType = {
        attestationId,
        eventId,
        fairnessAnalysis,
        attestorAddress,
        attestationTimestamp: new Date().toISOString(),
        signature,
        nullTokenPayment,
        canonEntry
      };
      
      // Store attestation
      attestations.set(attestationId, attestation);
      eventAnalyses.set(eventId, fairnessAnalysis);
      
      return {
        success: true,
        attestationId,
        message: 'Attestation created successfully',
        canonEntry
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({
        error: 'Failed to create attestation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get fairness index
server.get<{ Querystring: GetFairnessIndexType }>(
  '/fairness-index',
  { schema: { querystring: GetFairnessIndexSchema } },
  async (request, reply) => {
    const { chain, eventType, limit = 50, offset = 0 } = request.query;
    
    // Filter analyses based on query parameters
    let filteredAnalyses = Array.from(eventAnalyses.values());
    
    if (chain) {
      filteredAnalyses = filteredAnalyses.filter(a => a.chain === chain);
    }
    
    if (eventType) {
      filteredAnalyses = filteredAnalyses.filter(a => a.eventType === eventType);
    }
    
    // Sort by score (descending)
    filteredAnalyses.sort((a, b) => b.overallScore - a.overallScore);
    
    // Apply pagination
    const paginatedAnalyses = filteredAnalyses.slice(offset, offset + limit);
    
    // Calculate statistics
    const stats = {
      total: filteredAnalyses.length,
      averageScore: filteredAnalyses.reduce((sum, a) => sum + a.overallScore, 0) / filteredAnalyses.length || 0,
      scoreDistribution: {
        excellent: filteredAnalyses.filter(a => a.scoreCategory === 'excellent').length,
        good: filteredAnalyses.filter(a => a.scoreCategory === 'good').length,
        fair: filteredAnalyses.filter(a => a.scoreCategory === 'fair').length,
        poor: filteredAnalyses.filter(a => a.scoreCategory === 'poor').length
      }
    };
    
    return {
      analyses: paginatedAnalyses,
      pagination: {
        limit,
        offset,
        total: filteredAnalyses.length,
        hasMore: offset + limit < filteredAnalyses.length
      },
      statistics: stats
    };
  }
);

// Get violation statistics
server.get<{ Querystring: GetViolationStatsType }>(
  '/violations/stats',
  { schema: { querystring: GetViolationStatsSchema } },
  async (request, reply) => {
    const { chain, violationType, severity, timeRange } = request.query;
    
    // Get all analyses
    let analyses = Array.from(eventAnalyses.values());
    
    // Apply filters
    if (chain) {
      analyses = analyses.filter(a => a.chain === chain);
    }
    
    if (timeRange) {
      const startTime = new Date(timeRange.start);
      const endTime = new Date(timeRange.end);
      analyses = analyses.filter(a => {
        const analysisTime = new Date(a.analysisTimestamp);
        return analysisTime >= startTime && analysisTime <= endTime;
      });
    }
    
    // Extract all violations
    let violations = analyses.flatMap(a => a.violations);
    
    if (violationType) {
      violations = violations.filter(v => v.type === violationType);
    }
    
    if (severity) {
      violations = violations.filter(v => v.severity === severity);
    }
    
    // Calculate statistics
    const violationStats = {
      total: violations.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byChain: {} as Record<string, number>,
      topViolations: [] as any[]
    };
    
    // Count by type
    for (const violation of violations) {
      violationStats.byType[violation.type] = (violationStats.byType[violation.type] || 0) + 1;
      violationStats.bySeverity[violation.severity] = (violationStats.bySeverity[violation.severity] || 0) + 1;
    }
    
    // Count by chain
    for (const analysis of analyses) {
      violationStats.byChain[analysis.chain] = (violationStats.byChain[analysis.chain] || 0) + analysis.violations.length;
    }
    
    // Get top violations (most frequent)
    const violationCounts = new Map<string, number>();
    for (const violation of violations) {
      const key = `${violation.type}_${violation.severity}`;
      violationCounts.set(key, (violationCounts.get(key) || 0) + 1);
    }
    
    violationStats.topViolations = Array.from(violationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => {
        const [type, severity] = key.split('_');
        return { type, severity, count };
      });
    
    return violationStats;
  }
);

// Get mempool statistics
server.get('/mempool/stats', async (request, reply) => {
  const stats = mempoolMonitor.getMempoolStats();
  const transactions = mempoolMonitor.getMempoolTransactions();
  const mevPatterns = mempoolMonitor.getMEVPatterns();
  
  return {
    ...stats,
    recentTransactions: transactions.slice(-10),
    recentMEVPatterns: mevPatterns.slice(-5)
  };
});

// Get active probes
server.get('/probes/active', async (request, reply) => {
  const activeProbes = probeOrchestrator.getActiveProbes();
  const probeResults = probeOrchestrator.getProbeResults();
  
  return {
    active: activeProbes,
    completed: probeResults.filter(r => r.success),
    failed: probeResults.filter(r => !r.success),
    total: probeResults.length
  };
});

// Start server
const start = async () => {
  try {
    // Start services
    await probeOrchestrator.start();
    
    // Start server
    await server.listen({ 
      port: cryptoFairnessConfig.server.port, 
      host: cryptoFairnessConfig.server.host 
    });
    
    console.log(`Crypto Fairness Relayer started on ${cryptoFairnessConfig.server.host}:${cryptoFairnessConfig.server.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await probeOrchestrator.stop();
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await probeOrchestrator.stop();
  await server.close();
  process.exit(0);
});

start();
