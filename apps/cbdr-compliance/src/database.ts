/**
 * Database connection and models for CBDR Compliance API
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { 
  TransferLog, 
  VendorRegistry, 
  RegulatoryData, 
  VendorAttestation,
  TransferRequest,
  TransferResponse,
  AdequacyDecision,
  SCCUpdate,
  WebhookSubscription,
  WebhookDelivery
} from './types';

export class CBDatabase {
  private pool: Pool;

  constructor(config: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
  }) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl || false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log('Connected to CBDR database');
      client.release();
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  // ============================================================================
  // Transfer Log Operations
  // ============================================================================

  async logTransfer(
    request: TransferRequest,
    response: TransferResponse
  ): Promise<void> {
    const query = `
      INSERT INTO transfer_logs (
        request_id, origin_country, destination_country, vendor_id,
        controller, purpose, data_categories, special_categories,
        claimed_legal_basis, decision, legal_basis_resolved, rationale,
        machine_rationale, audit_token, client_ref, signature, transfer_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `;

    const values = [
      response.request_id,
      request.origin_country,
      request.destination_country,
      request.vendor_id,
      request.processing_context.controller,
      request.processing_context.purpose,
      request.processing_context.data_categories,
      request.processing_context.special_categories,
      request.claimed_legal_basis,
      response.decision,
      response.legal_basis_resolved,
      response.rationale,
      JSON.stringify(response.machine_rationale),
      response.audit.audit_token,
      request.client_ref,
      response.signature,
      request.transfer_date
    ];

    await this.pool.query(query, values);
  }

  async getTransferLog(requestId: string): Promise<TransferLog | null> {
    const query = 'SELECT * FROM transfer_logs WHERE request_id = $1';
    const result = await this.pool.query(query, [requestId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapTransferLog(result.rows[0]);
  }

  async getTransferLogsByAuditToken(auditToken: string): Promise<TransferLog[]> {
    const query = 'SELECT * FROM transfer_logs WHERE audit_token = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [auditToken]);
    
    return result.rows.map(row => this.mapTransferLog(row));
  }

  // ============================================================================
  // Vendor Operations
  // ============================================================================

  async getVendor(vendorId: string): Promise<VendorRegistry | null> {
    const query = 'SELECT * FROM vendors WHERE vendor_id = $1';
    const result = await this.pool.query(query, [vendorId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapVendor(result.rows[0]);
  }

  async getVendorAttestations(vendorId: string): Promise<VendorAttestation[]> {
    const query = `
      SELECT * FROM vendor_attestations 
      WHERE vendor_id = $1 AND status = 'active' 
      AND (expiry_date IS NULL OR expiry_date > NOW())
      ORDER BY issued_date DESC
    `;
    const result = await this.pool.query(query, [vendorId]);
    
    return result.rows.map(row => this.mapVendorAttestation(row));
  }

  async createVendorAttestation(attestation: Omit<VendorAttestation, 'id'>): Promise<VendorAttestation> {
    const query = `
      INSERT INTO vendor_attestations (
        vendor_id, program, status, attestation_id, issued_date,
        expiry_date, modules, certifications, evidence_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      attestation.vendor_id,
      attestation.program,
      attestation.status,
      attestation.attestation_id,
      attestation.issued_date,
      attestation.expiry_date,
      attestation.modules,
      attestation.certifications,
      attestation.evidence_url
    ];

    const result = await this.pool.query(query, values);
    return this.mapVendorAttestation(result.rows[0]);
  }

  // ============================================================================
  // Regulatory Data Operations
  // ============================================================================

  async getAdequacyDecision(countryCode: string): Promise<AdequacyDecision | null> {
    const query = `
      SELECT * FROM regulatory_data 
      WHERE type = 'adequacy' AND country_code = $1 
      AND (expiry_date IS NULL OR expiry_date > NOW())
      ORDER BY effective_date DESC
      LIMIT 1
    `;
    const result = await this.pool.query(query, [countryCode]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      country_code: row.country_code,
      status: row.data.status,
      decision_date: row.effective_date,
      reference: row.reference,
      url: row.url,
      notes: row.description
    };
  }

  async getSCCUpdates(): Promise<SCCUpdate[]> {
    const query = `
      SELECT * FROM regulatory_data 
      WHERE type = 'scc' 
      AND (expiry_date IS NULL OR expiry_date > NOW())
      ORDER BY effective_date DESC
    `;
    const result = await this.pool.query(query);
    
    return result.rows.map(row => ({
      version: row.data.version,
      effective_date: row.effective_date,
      modules: row.data.modules,
      changes: row.data.changes || [],
      reference: row.reference,
      url: row.url
    }));
  }

  async getRegulatoryData(type: string, countryCode?: string): Promise<RegulatoryData[]> {
    let query = 'SELECT * FROM regulatory_data WHERE type = $1';
    const values: any[] = [type];
    
    if (countryCode) {
      query += ' AND country_code = $2';
      values.push(countryCode);
    }
    
    query += ' AND (expiry_date IS NULL OR expiry_date > NOW()) ORDER BY effective_date DESC';
    
    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapRegulatoryData(row));
  }

  // ============================================================================
  // Cache Operations
  // ============================================================================

  async getCachedResponse(cacheKey: string): Promise<TransferResponse | null> {
    const query = `
      SELECT response_data FROM cache_entries 
      WHERE cache_key = $1 AND expires_at > NOW()
    `;
    const result = await this.pool.query(query, [cacheKey]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].response_data as TransferResponse;
  }

  async setCachedResponse(
    cacheKey: string, 
    response: TransferResponse, 
    ttlSeconds: number,
    regulatoryVersion: string
  ): Promise<void> {
    const query = `
      INSERT INTO cache_entries (cache_key, response_data, ttl_seconds, regulatory_version, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${ttlSeconds} seconds')
      ON CONFLICT (cache_key) DO UPDATE SET
        response_data = EXCLUDED.response_data,
        ttl_seconds = EXCLUDED.ttl_seconds,
        regulatory_version = EXCLUDED.regulatory_version,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW()
    `;

    await this.pool.query(query, [cacheKey, JSON.stringify(response), ttlSeconds, regulatoryVersion]);
  }

  async invalidateCache(pattern?: string): Promise<number> {
    let query = 'DELETE FROM cache_entries';
    const values: any[] = [];
    
    if (pattern) {
      query += ' WHERE cache_key LIKE $1';
      values.push(pattern);
    }
    
    const result = await this.pool.query(query, values);
    return result.rowCount || 0;
  }

  // ============================================================================
  // Webhook Operations
  // ============================================================================

  async getWebhookSubscriptions(eventTypes?: string[]): Promise<WebhookSubscription[]> {
    let query = 'SELECT * FROM webhook_subscriptions WHERE status = $1';
    const values: any[] = ['active'];
    
    if (eventTypes && eventTypes.length > 0) {
      query += ' AND events && $2';
      values.push(eventTypes);
    }
    
    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapWebhookSubscription(row));
  }

  async logWebhookDelivery(delivery: Omit<WebhookDelivery, 'id'>): Promise<WebhookDelivery> {
    const query = `
      INSERT INTO webhook_deliveries (
        subscription_id, event_type, payload, status, response_code,
        response_body, attempts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      delivery.subscription_id,
      delivery.event_type,
      JSON.stringify(delivery.payload),
      delivery.status,
      delivery.response_code,
      delivery.response_body,
      delivery.attempts
    ];

    const result = await this.pool.query(query, values);
    return this.mapWebhookDelivery(result.rows[0]);
  }

  // ============================================================================
  // Utility Operations
  // ============================================================================

  async cleanupExpiredCache(): Promise<number> {
    const result = await this.pool.query('SELECT cleanup_expired_cache()');
    return result.rows[0].cleanup_expired_cache;
  }

  async getTransferStats(days: number = 30): Promise<any> {
    const query = `
      SELECT 
        decision,
        legal_basis_resolved,
        COUNT(*) as count,
        COUNT(DISTINCT origin_country) as origin_countries,
        COUNT(DISTINCT destination_country) as destination_countries,
        COUNT(DISTINCT vendor_id) as vendors
      FROM transfer_logs 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY decision, legal_basis_resolved
      ORDER BY count DESC
    `;
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  // ============================================================================
  // Mapping Functions
  // ============================================================================

  private mapTransferLog(row: any): TransferLog {
    return {
      id: row.id,
      request_id: row.request_id,
      origin_country: row.origin_country,
      destination_country: row.destination_country,
      vendor_id: row.vendor_id,
      controller: row.controller,
      decision: row.decision,
      legal_basis: row.legal_basis_resolved,
      rationale: row.rationale,
      audit_token: row.audit_token,
      client_ref: row.client_ref,
      created_at: row.created_at,
      signature: row.signature
    };
  }

  private mapVendor(row: any): VendorRegistry {
    return {
      vendor_id: row.vendor_id,
      name: row.name,
      website: row.website,
      attestations: [], // Will be loaded separately
      created_at: row.created_at,
      updated_at: row.updated_at,
      status: row.status
    };
  }

  private mapVendorAttestation(row: any): VendorAttestation {
    return {
      vendor_id: row.vendor_id,
      program: row.program,
      status: row.status,
      attestation_id: row.attestation_id,
      issued_date: row.issued_date,
      expiry_date: row.expiry_date,
      modules: row.modules,
      certifications: row.certifications
    };
  }

  private mapRegulatoryData(row: any): RegulatoryData {
    return {
      id: row.id,
      type: row.type,
      country_code: row.country_code,
      data: row.data,
      effective_date: row.effective_date,
      expiry_date: row.expiry_date,
      source: row.source,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private mapWebhookSubscription(row: any): WebhookSubscription {
    return {
      id: row.id,
      endpoint_url: row.endpoint_url,
      events: row.events,
      secret_token: row.secret_token,
      status: row.status,
      retry_attempts: row.retry_attempts,
      last_delivery: row.last_delivery,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private mapWebhookDelivery(row: any): WebhookDelivery {
    return {
      id: row.id,
      subscription_id: row.subscription_id,
      event_type: row.event_type,
      payload: row.payload,
      status: row.status,
      response_code: row.response_code,
      response_body: row.response_body,
      attempts: row.attempts,
      created_at: row.created_at,
      delivered_at: row.delivered_at
    };
  }
}
