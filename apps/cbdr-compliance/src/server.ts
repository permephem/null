/**
 * CBDR Compliance API Server
 * 
 * Main Express.js server providing REST API endpoints for cross-border
 * data regulation compliance checking.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { 
  TransferRequest, 
  TransferResponse, 
  CBDRError, 
  ErrorCode,
  CBDRConfig,
  WebhookSubscription,
  VendorAttestation
} from './types';
import { CBDatabase } from './database';
import { CBDRDecisionEngine } from './decision-engine';
import { AuditLogger } from './audit';

export class CBDRServer {
  private app: express.Application;
  private db: CBDatabase;
  private decisionEngine: CBDRDecisionEngine;
  private auditLogger: AuditLogger;
  private config: CBDRConfig;

  constructor(config: CBDRConfig) {
    this.config = config;
    this.app = express();
    this.setupDatabase();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupDatabase(): void {
    this.db = new CBDatabase(this.config.database);
    this.decisionEngine = new CBDRDecisionEngine(this.db);
    this.auditLogger = new AuditLogger(
      this.db, 
      this.config.security.jws_secret,
      this.config.security.jws_secret // Using same key for HMAC
    );
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: this.config.security.rate_limit_per_minute,
      message: {
        error: 'Rate limit exceeded',
        code: ErrorCode.RATE_LIMIT_EXCEEDED
      }
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });

    // API key authentication (if required)
    if (this.config.security.api_key_required) {
      this.app.use('/api/', this.authenticateApiKey.bind(this));
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', this.healthCheck.bind(this));

    // Transfer compliance endpoints
    this.app.post('/api/v1/transfer/check', this.checkTransfer.bind(this));
    this.app.get('/api/v1/transfer/:requestId', this.getTransferResult.bind(this));
    this.app.get('/api/v1/audit/:auditToken', this.getAuditTrail.bind(this));

    // Vendor management endpoints
    this.app.get('/api/v1/vendors', this.getVendors.bind(this));
    this.app.get('/api/v1/vendors/:vendorId', this.getVendor.bind(this));
    this.app.get('/api/v1/vendors/:vendorId/attestations', this.getVendorAttestations.bind(this));
    this.app.post('/api/v1/vendors/:vendorId/attestations', this.createVendorAttestation.bind(this));

    // Regulatory data endpoints
    this.app.get('/api/v1/regulatory/adequacy-decisions', this.getAdequacyDecisions.bind(this));
    this.app.get('/api/v1/regulatory/adequacy-decisions/:countryCode', this.getAdequacyDecision.bind(this));
    this.app.get('/api/v1/regulatory/scc-updates', this.getSCCUpdates.bind(this));
    this.app.get('/api/v1/regulatory/updates', this.getRegulatoryUpdates.bind(this));

    // Webhook management endpoints
    this.app.get('/api/v1/webhooks', this.getWebhookSubscriptions.bind(this));
    this.app.post('/api/v1/webhooks', this.createWebhookSubscription.bind(this));
    this.app.delete('/api/v1/webhooks/:id', this.deleteWebhookSubscription.bind(this));

    // Statistics and monitoring
    this.app.get('/api/v1/stats/transfers', this.getTransferStats.bind(this));
    this.app.get('/api/v1/stats/vendors', this.getVendorStats.bind(this));

    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }

  // ============================================================================
  // Authentication Middleware
  // ============================================================================

  private authenticateApiKey(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json({
        error: 'API key required',
        code: 'MISSING_API_KEY'
      });
      return;
    }

    // In production, validate against database or external service
    if (apiKey !== process.env.API_KEY) {
      res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
      return;
    }

    next();
  }

  // ============================================================================
  // Transfer Compliance Endpoints
  // ============================================================================

  private async checkTransfer(req: express.Request, res: express.Response): Promise<void> {
    try {
      const request: TransferRequest = req.body;
      
      // Validate request
      this.validateTransferRequest(request);
      
      // Evaluate transfer
      const response = await this.decisionEngine.evaluateTransfer(request);
      
      // Log decision
      await this.auditLogger.logTransferDecision(request, response);
      
      res.json(response);
    } catch (error) {
      if (error instanceof CBDRError) {
        res.status(400).json(error);
      } else {
        console.error('Transfer check error:', error);
        res.status(500).json({
          error: 'Internal server error',
          code: ErrorCode.INTERNAL_ERROR,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  private async getTransferResult(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const transfer = await this.db.getTransferLog(requestId);
      
      if (!transfer) {
        res.status(404).json({
          error: 'Transfer not found',
          code: 'TRANSFER_NOT_FOUND'
        });
        return;
      }

      res.json(transfer);
    } catch (error) {
      console.error('Get transfer result error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  private async getAuditTrail(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { auditToken } = req.params;
      const auditTrail = await this.auditLogger.generateAuditTrail(auditToken);
      
      res.json(auditTrail);
    } catch (error) {
      console.error('Get audit trail error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  // ============================================================================
  // Vendor Management Endpoints
  // ============================================================================

  private async getVendors(req: express.Request, res: express.Response): Promise<void> {
    try {
      // This would typically be a paginated query
      res.json({ message: 'Vendor list endpoint - implement pagination' });
    } catch (error) {
      console.error('Get vendors error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  private async getVendor(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { vendorId } = req.params;
      const vendor = await this.db.getVendor(vendorId);
      
      if (!vendor) {
        res.status(404).json({
          error: 'Vendor not found',
          code: 'VENDOR_NOT_FOUND'
        });
        return;
      }

      res.json(vendor);
    } catch (error) {
      console.error('Get vendor error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  private async getVendorAttestations(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { vendorId } = req.params;
      const attestations = await this.db.getVendorAttestations(vendorId);
      
      res.json(attestations);
    } catch (error) {
      console.error('Get vendor attestations error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  private async createVendorAttestation(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { vendorId } = req.params;
      const attestationData: Omit<VendorAttestation, 'id'> = req.body;
      
      // Validate vendor exists
      const vendor = await this.db.getVendor(vendorId);
      if (!vendor) {
        res.status(404).json({
          error: 'Vendor not found',
          code: 'VENDOR_NOT_FOUND'
        });
        return;
      }

      const attestation = await this.db.createVendorAttestation(attestationData);
      res.status(201).json(attestation);
    } catch (error) {
      console.error('Create vendor attestation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  // ============================================================================
  // Regulatory Data Endpoints
  // ============================================================================

  private async getAdequacyDecisions(req: express.Request, res: express.Response): Promise<void> {
    try {
      const decisions = await this.db.getRegulatoryData('adequacy');
      res.json(decisions);
    } catch (error) {
      console.error('Get adequacy decisions error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  private async getAdequacyDecision(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { countryCode } = req.params;
      const decision = await this.db.getAdequacyDecision(countryCode);
      
      if (!decision) {
        res.status(404).json({
          error: 'Adequacy decision not found',
          code: 'ADEQUACY_DECISION_NOT_FOUND'
        });
        return;
      }

      res.json(decision);
    } catch (error) {
      console.error('Get adequacy decision error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  private async getSCCUpdates(req: express.Request, res: express.Response): Promise<void> {
    try {
      const updates = await this.db.getSCCUpdates();
      res.json(updates);
    } catch (error) {
      console.error('Get SCC updates error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  private async getRegulatoryUpdates(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { type, country } = req.query;
      const updates = await this.db.getRegulatoryData(
        type as string, 
        country as string
      );
      res.json(updates);
    } catch (error) {
      console.error('Get regulatory updates error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  // ============================================================================
  // Webhook Management Endpoints
  // ============================================================================

  private async getWebhookSubscriptions(req: express.Request, res: express.Response): Promise<void> {
    try {
      const subscriptions = await this.db.getWebhookSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error('Get webhook subscriptions error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  private async createWebhookSubscription(req: express.Request, res: express.Response): Promise<void> {
    try {
      // Implementation would create webhook subscription
      res.status(201).json({ message: 'Webhook subscription created' });
    } catch (error) {
      console.error('Create webhook subscription error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  private async deleteWebhookSubscription(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      // Implementation would delete webhook subscription
      res.json({ message: 'Webhook subscription deleted' });
    } catch (error) {
      console.error('Delete webhook subscription error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  // ============================================================================
  // Statistics and Monitoring Endpoints
  // ============================================================================

  private async getTransferStats(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { days = 30 } = req.query;
      const stats = await this.db.getTransferStats(Number(days));
      res.json(stats);
    } catch (error) {
      console.error('Get transfer stats error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  private async getVendorStats(req: express.Request, res: express.Response): Promise<void> {
    try {
      // Implementation would return vendor statistics
      res.json({ message: 'Vendor stats endpoint' });
    } catch (error) {
      console.error('Get vendor stats error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR
      });
    }
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  private async healthCheck(req: express.Request, res: express.Response): Promise<void> {
    try {
      await this.db.connect();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  // ============================================================================
  // Validation and Error Handling
  // ============================================================================

  private validateTransferRequest(request: TransferRequest): void {
    if (!request.origin_country || !request.destination_country) {
      throw new CBDRError({
        code: ErrorCode.INVALID_COUNTRY_CODE,
        message: 'Origin and destination countries are required',
        timestamp: new Date().toISOString()
      });
    }

    if (!request.vendor_id) {
      throw new CBDRError({
        code: ErrorCode.UNKNOWN_VENDOR,
        message: 'Vendor ID is required',
        timestamp: new Date().toISOString()
      });
    }

    if (!request.processing_context) {
      throw new CBDRError({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Processing context is required',
        timestamp: new Date().toISOString()
      });
    }

    if (!request.claimed_legal_basis) {
      throw new CBDRError({
        code: ErrorCode.INVALID_LEGAL_BASIS,
        message: 'Legal basis is required',
        timestamp: new Date().toISOString()
      });
    }
  }

  private errorHandler(
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void {
    console.error('Unhandled error:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      code: ErrorCode.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }

  // ============================================================================
  // Server Lifecycle
  // ============================================================================

  async start(): Promise<void> {
    try {
      await this.db.connect();
      
      this.app.listen(this.config.port, () => {
        console.log(`CBDR Compliance API running on port ${this.config.port}`);
        console.log(`Health check: http://localhost:${this.config.port}/health`);
        console.log(`API docs: http://localhost:${this.config.port}/api/v1/`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    await this.db.disconnect();
  }
}
