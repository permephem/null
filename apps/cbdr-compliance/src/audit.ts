/**
 * Audit Logging and Signature System for CBDR Compliance
 * 
 * Provides immutable audit trails and cryptographic signatures for
 * regulatory compliance and non-repudiation.
 */

import { createHmac, createSign, createVerify } from 'crypto';
import { 
  TransferRequest, 
  TransferResponse, 
  WebhookEvent, 
  WebhookEventType,
  AuditInfo 
} from './types';
import { CBDatabase } from './database';

export class AuditLogger {
  private db: CBDatabase;
  private signingKey: string;
  private hmacSecret: string;

  constructor(database: CBDatabase, signingKey: string, hmacSecret: string) {
    this.db = database;
    this.signingKey = signingKey;
    this.hmacSecret = hmacSecret;
  }

  /**
   * Log a transfer decision with full audit trail
   */
  async logTransferDecision(
    request: TransferRequest,
    response: TransferResponse
  ): Promise<void> {
    try {
      // Sign the response
      const signedResponse = await this.signResponse(response);
      
      // Log to database
      await this.db.logTransfer(request, signedResponse);
      
      // Send webhook notifications
      await this.sendWebhookNotifications(request, signedResponse);
      
    } catch (error) {
      console.error('Failed to log transfer decision:', error);
      // Don't throw - audit logging failure shouldn't break the main flow
    }
  }

  /**
   * Sign a response with JWS (JSON Web Signature)
   */
  async signResponse(response: TransferResponse): Promise<TransferResponse> {
    const payload = {
      request_id: response.request_id,
      decision: response.decision,
      legal_basis_resolved: response.legal_basis_resolved,
      rationale: response.rationale,
      machine_rationale: response.machine_rationale,
      audit_token: response.audit.audit_token,
      timestamp: response.audit.timestamp
    };

    const signature = this.createJWSSignature(payload);
    
    return {
      ...response,
      signature
    };
  }

  /**
   * Verify a response signature
   */
  async verifyResponse(response: TransferResponse): Promise<boolean> {
    try {
      const payload = {
        request_id: response.request_id,
        decision: response.decision,
        legal_basis_resolved: response.legal_basis_resolved,
        rationale: response.rationale,
        machine_rationale: response.machine_rationale,
        audit_token: response.audit.audit_token,
        timestamp: response.audit.timestamp
      };

      return this.verifyJWSSignature(payload, response.signature);
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Create audit hash for regulatory investigations
   */
  createAuditHash(auditToken: string, timestamp: string): string {
    const data = `${auditToken}:${timestamp}`;
    return createHmac('sha256', this.hmacSecret)
      .update(data)
      .digest('hex');
  }

  /**
   * Generate audit trail for regulatory investigation
   */
  async generateAuditTrail(auditToken: string): Promise<{
    audit_token: string;
    audit_hash: string;
    transfers: any[];
    timeline: any[];
    regulatory_references: any[];
  }> {
    const transfers = await this.db.getTransferLogsByAuditToken(auditToken);
    
    if (transfers.length === 0) {
      throw new Error(`No audit trail found for token: ${auditToken}`);
    }

    const firstTransfer = transfers[0];
    const auditHash = this.createAuditHash(auditToken, firstTransfer.created_at.toISOString());
    
    const timeline = transfers.map(transfer => ({
      timestamp: transfer.created_at,
      event: 'transfer_decision',
      decision: transfer.decision,
      legal_basis: transfer.legal_basis,
      rationale: transfer.rationale,
      signature: transfer.signature
    }));

    const regulatoryReferences = await this.getRegulatoryReferences(transfers);

    return {
      audit_token: auditToken,
      audit_hash: auditHash,
      transfers: transfers.map(t => this.sanitizeTransferForAudit(t)),
      timeline,
      regulatory_references: regulatoryReferences
    };
  }

  /**
   * Send webhook notifications for audit events
   */
  private async sendWebhookNotifications(
    request: TransferRequest,
    response: TransferResponse
  ): Promise<void> {
    try {
      const subscriptions = await this.db.getWebhookSubscriptions([
        WebhookEventType.TRANSFER_CHECK_LOGGED
      ]);

      const event: WebhookEvent = {
        event: WebhookEventType.TRANSFER_CHECK_LOGGED,
        request_id: response.request_id,
        audit_token: response.audit.audit_token,
        decision: response.decision,
        legal_basis_resolved: response.legal_basis_resolved,
        controller: request.processing_context.controller,
        vendor_id: request.vendor_id,
        timestamp: response.audit.timestamp
      };

      // Send to all active subscriptions
      for (const subscription of subscriptions) {
        await this.deliverWebhook(subscription, event);
      }
    } catch (error) {
      console.error('Failed to send webhook notifications:', error);
    }
  }

  /**
   * Deliver webhook to a specific endpoint
   */
  private async deliverWebhook(
    subscription: any,
    event: WebhookEvent
  ): Promise<void> {
    try {
      const payload = JSON.stringify(event);
      const signature = this.createWebhookSignature(payload, subscription.secret_token);

      const response = await fetch(subscription.endpoint_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CBDR-Signature': signature,
          'X-CBDR-Event': event.event,
          'User-Agent': 'CBDR-Compliance-API/1.0'
        },
        body: payload,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      await this.db.logWebhookDelivery({
        subscription_id: subscription.id,
        event_type: event.event,
        payload: event,
        status: response.ok ? 'delivered' : 'failed',
        response_code: response.status,
        response_body: await response.text(),
        attempts: 1
      });

    } catch (error) {
      console.error(`Webhook delivery failed for ${subscription.endpoint_url}:`, error);
      
      await this.db.logWebhookDelivery({
        subscription_id: subscription.id,
        event_type: event.event,
        payload: event,
        status: 'failed',
        response_code: 0,
        response_body: error.message,
        attempts: 1
      });
    }
  }

  /**
   * Create JWS signature for response
   */
  private createJWSSignature(payload: any): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac('sha256', this.signingKey)
      .update(data)
      .digest('base64url');

    return `${data}.${signature}`;
  }

  /**
   * Verify JWS signature
   */
  private verifyJWSSignature(payload: any, jws: string): boolean {
    try {
      const parts = jws.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const [encodedHeader, encodedPayload, signature] = parts;
      
      // Verify payload matches
      const expectedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
      if (encodedPayload !== expectedPayload) {
        return false;
      }

      // Verify signature
      const data = `${encodedHeader}.${encodedPayload}`;
      const expectedSignature = createHmac('sha256', this.signingKey)
        .update(data)
        .digest('base64url');

      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create webhook signature for delivery verification
   */
  private createWebhookSignature(payload: string, secret?: string): string {
    if (!secret) {
      return '';
    }

    return createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Get regulatory references for audit trail
   */
  private async getRegulatoryReferences(transfers: any[]): Promise<any[]> {
    const references = new Set<string>();
    
    for (const transfer of transfers) {
      // Extract regulatory references from rationale and machine_rationale
      const rationale = transfer.rationale;
      const machineRationale = transfer.machine_rationale;
      
      // This is a simplified implementation - real version would parse
      // regulatory references from the decision rationale
      if (rationale.includes('adequacy')) {
        references.add('EU-US Data Privacy Framework');
      }
      if (rationale.includes('SCC')) {
        references.add('Standard Contractual Clauses 2021/914');
      }
      if (rationale.includes('Art. 49')) {
        references.add('GDPR Article 49 Derogations');
      }
    }

    return Array.from(references).map(ref => ({
      title: ref,
      type: this.getReferenceType(ref),
      url: this.getReferenceURL(ref)
    }));
  }

  /**
   * Get reference type from title
   */
  private getReferenceType(title: string): string {
    if (title.includes('adequacy')) return 'adequacy';
    if (title.includes('SCC')) return 'scc';
    if (title.includes('Art. 49')) return 'derogation';
    return 'guidance';
  }

  /**
   * Get reference URL from title
   */
  private getReferenceURL(title: string): string {
    if (title.includes('EU-US Data Privacy Framework')) {
      return 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023D1025';
    }
    if (title.includes('Standard Contractual Clauses')) {
      return 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32021D0914';
    }
    if (title.includes('Art. 49')) {
      return 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679';
    }
    return 'https://edpb.europa.eu/';
  }

  /**
   * Sanitize transfer data for audit trail (remove sensitive info)
   */
  private sanitizeTransferForAudit(transfer: any): any {
    return {
      id: transfer.id,
      request_id: transfer.request_id,
      origin_country: transfer.origin_country,
      destination_country: transfer.destination_country,
      vendor_id: transfer.vendor_id,
      controller: transfer.controller,
      decision: transfer.decision,
      legal_basis: transfer.legal_basis,
      rationale: transfer.rationale,
      audit_token: transfer.audit_token,
      created_at: transfer.created_at,
      signature: transfer.signature
    };
  }

  /**
   * Create regulatory change notification
   */
  async notifyRegulatoryChange(
    changeType: string,
    description: string,
    affectedCountries?: string[],
    affectedVendors?: string[]
  ): Promise<void> {
    try {
      const subscriptions = await this.db.getWebhookSubscriptions([
        WebhookEventType.REGULATORY_UPDATE
      ]);

      const event: WebhookEvent = {
        event: WebhookEventType.REGULATORY_UPDATE,
        request_id: '', // Not applicable for regulatory updates
        audit_token: this.generateAuditToken(),
        decision: 'N/A' as any,
        legal_basis_resolved: 'N/A' as any,
        controller: 'CBDR System',
        vendor_id: 'system',
        timestamp: new Date().toISOString(),
        metadata: {
          change_type: changeType,
          description,
          affected_countries: affectedCountries,
          affected_vendors: affectedVendors
        }
      };

      for (const subscription of subscriptions) {
        await this.deliverWebhook(subscription, event);
      }
    } catch (error) {
      console.error('Failed to send regulatory change notification:', error);
    }
  }

  /**
   * Generate audit token
   */
  private generateAuditToken(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `aud_${timestamp}${random}`.toUpperCase();
  }
}
