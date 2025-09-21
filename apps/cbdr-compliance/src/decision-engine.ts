/**
 * Decision Engine for Cross-Border Data Regulation Compliance
 * 
 * Implements the core logic for evaluating GDPR compliance of international
 * data transfers under Articles 45, 46, and 49.
 */

import { 
  TransferRequest, 
  TransferResponse, 
  TransferDecision, 
  LegalBasis,
  DataCategory,
  MachineRationale,
  RegulatoryReference,
  VendorAttestation,
  TransferCondition,
  TransferConstraint,
  ConditionType,
  ConstraintType,
  AdequacyDecision,
  SCCUpdate,
  CBDRError,
  ErrorCode
} from './types';
import { CBDatabase } from './database';

export class CBDRDecisionEngine {
  private db: CBDatabase;

  constructor(database: CBDatabase) {
    this.db = database;
  }

  /**
   * Main decision function - evaluates a transfer request and returns compliance decision
   */
  async evaluateTransfer(request: TransferRequest): Promise<TransferResponse> {
    try {
      // Generate unique identifiers
      const requestId = this.generateRequestId();
      const auditToken = this.generateAuditToken();

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedResponse = await this.db.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Evaluate based on claimed legal basis
      let decision: TransferResponse;
      
      switch (request.claimed_legal_basis) {
        case LegalBasis.ART45_ADEQUACY:
          decision = await this.evaluateAdequacy(request, requestId, auditToken);
          break;
        case LegalBasis.ART46_SCC:
          decision = await this.evaluateSCC(request, requestId, auditToken);
          break;
        case LegalBasis.ART46_BCR:
          decision = await this.evaluateBCR(request, requestId, auditToken);
          break;
        case LegalBasis.ART49_DEROGATION:
        case LegalBasis.ART49_VITAL_INTERESTS:
        case LegalBasis.ART49_PUBLIC_INTEREST:
        case LegalBasis.ART49_LEGITIMATE_INTERESTS:
        case LegalBasis.ART49_CONSENT:
        case LegalBasis.ART49_CONTRACT:
          decision = await this.evaluateDerogation(request, requestId, auditToken);
          break;
        default:
          throw new CBDRError({
            code: ErrorCode.INVALID_LEGAL_BASIS,
            message: `Invalid legal basis: ${request.claimed_legal_basis}`,
            request_id: requestId,
            timestamp: new Date().toISOString()
          });
      }

      // Cache the response with appropriate TTL
      const ttlSeconds = this.getCacheTTL(decision.legal_basis_resolved);
      await this.db.setCachedResponse(cacheKey, decision, ttlSeconds, 'current');

      return decision;

    } catch (error) {
      if (error instanceof CBDRError) {
        throw error;
      }
      
      throw new CBDRError({
        code: ErrorCode.INTERNAL_ERROR,
        message: `Decision engine error: ${error.message}`,
        request_id: this.generateRequestId(),
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Evaluate transfer under Article 45 (Adequacy Decisions)
   */
  private async evaluateAdequacy(
    request: TransferRequest, 
    requestId: string, 
    auditToken: string
  ): Promise<TransferResponse> {
    const adequacyDecision = await this.db.getAdequacyDecision(request.destination_country);
    
    if (!adequacyDecision) {
      return this.createDenyResponse(
        request,
        requestId,
        auditToken,
        LegalBasis.ART45_ADEQUACY,
        `No adequacy decision found for ${request.destination_country}.`,
        {
          rules: [`adequacy(${request.destination_country})==false`],
          evidence: [`no_adequacy_decision_${request.destination_country}`]
        }
      );
    }

    if (adequacyDecision.status === 'adequate') {
      return this.createAllowResponse(
        request,
        requestId,
        auditToken,
        LegalBasis.ART45_ADEQUACY,
        `${request.destination_country} has adequacy decision: ${adequacyDecision.reference}.`,
        {
          rules: [`adequacy(${request.destination_country})==true`],
          evidence: [`adequacy_decision_${request.destination_country}_${adequacyDecision.decision_date}`]
        },
        [{
          title: adequacyDecision.reference,
          url: adequacyDecision.url,
          type: 'adequacy'
        }]
      );
    }

    return this.createDenyResponse(
      request,
      requestId,
      auditToken,
      LegalBasis.ART45_ADEQUACY,
      `${request.destination_country} adequacy decision status: ${adequacyDecision.status}.`,
      {
        rules: [`adequacy(${request.destination_country})==${adequacyDecision.status}`],
        evidence: [`adequacy_decision_${request.destination_country}_${adequacyDecision.decision_date}`]
      }
    );
  }

  /**
   * Evaluate transfer under Article 46 (Standard Contractual Clauses)
   */
  private async evaluateSCC(
    request: TransferRequest, 
    requestId: string, 
    auditToken: string
  ): Promise<TransferResponse> {
    // Check if vendor has valid SCC attestations
    const vendorAttestations = await this.db.getVendorAttestations(request.vendor_id);
    const sccAttestations = vendorAttestations.filter(att => 
      att.program.startsWith('SCC_') && att.status === 'active'
    );

    if (sccAttestations.length === 0) {
      return this.createDenyResponse(
        request,
        requestId,
        auditToken,
        LegalBasis.ART46_SCC,
        `Vendor ${request.vendor_id} has no active SCC attestations.`,
        {
          rules: [`vendor_attestation(${request.vendor_id},SCC)==false`],
          evidence: [`no_scc_attestation_${request.vendor_id}`]
        }
      );
    }

    // Check if SCC modules are appropriate for the transfer type
    const requiredModules = this.getRequiredSCCModules(request);
    const availableModules = sccAttestations.flatMap(att => att.modules || []);
    const hasRequiredModules = requiredModules.every(module => 
      availableModules.includes(module)
    );

    if (!hasRequiredModules) {
      return this.createDenyResponse(
        request,
        requestId,
        auditToken,
        LegalBasis.ART46_SCC,
        `Vendor ${request.vendor_id} missing required SCC modules: ${requiredModules.join(', ')}.`,
        {
          rules: [`scc_modules(${request.vendor_id})==incomplete`],
          evidence: [`scc_modules_${request.vendor_id}_${availableModules.join('_')}`]
        }
      );
    }

    // Check for Transfer Impact Assessment requirements
    const tiaRequired = this.isTIARequired(request);
    const conditions: TransferCondition[] = [
      {
        type: ConditionType.SCC_ENFORCEMENT,
        status: 'required'
      }
    ];

    if (tiaRequired) {
      conditions.push({
        type: ConditionType.TIA_PROFILE,
        status: 'required',
        name: 'TIA-Standard-2025'
      });
    }

    return this.createConditionalAllowResponse(
      request,
      requestId,
      auditToken,
      LegalBasis.ART46_SCC,
      `Vendor ${request.vendor_id} has valid SCC attestations. Transfer permitted subject to SCC enforcement${tiaRequired ? ' and TIA' : ''}.`,
      {
        rules: [
          `vendor_attestation(${request.vendor_id},SCC)==active`,
          `scc_modules(${request.vendor_id})==complete`,
          tiaRequired ? 'tia_required==true' : 'tia_required==false'
        ],
        evidence: [
          `scc_attestation_${request.vendor_id}_active`,
          tiaRequired ? 'tia_profile_tia_2025_v2' : 'no_tia_required'
        ]
      },
      [{
        title: 'GDPR Art. 46 (SCCs)',
        url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32021D0914',
        type: 'scc'
      }],
      sccAttestations,
      conditions
    );
  }

  /**
   * Evaluate transfer under Article 46 (Binding Corporate Rules)
   */
  private async evaluateBCR(
    request: TransferRequest, 
    requestId: string, 
    auditToken: string
  ): Promise<TransferResponse> {
    const vendorAttestations = await this.db.getVendorAttestations(request.vendor_id);
    const bcrAttestations = vendorAttestations.filter(att => 
      att.program === 'BCR' && att.status === 'active'
    );

    if (bcrAttestations.length === 0) {
      return this.createDenyResponse(
        request,
        requestId,
        auditToken,
        LegalBasis.ART46_BCR,
        `Vendor ${request.vendor_id} has no active BCR attestations.`,
        {
          rules: [`vendor_attestation(${request.vendor_id},BCR)==false`],
          evidence: [`no_bcr_attestation_${request.vendor_id}`]
        }
      );
    }

    return this.createConditionalAllowResponse(
      request,
      requestId,
      auditToken,
      LegalBasis.ART46_BCR,
      `Vendor ${request.vendor_id} has valid BCR attestations. Transfer permitted subject to BCR enforcement.`,
      {
        rules: [`vendor_attestation(${request.vendor_id},BCR)==active`],
        evidence: [`bcr_attestation_${request.vendor_id}_active`]
      },
      [{
        title: 'GDPR Art. 46 (BCRs)',
        url: 'https://edpb.europa.eu/our-work-tools/general-guidance/gdpr-guidelines-recommendations-best-practices_en',
        type: 'guidance'
      }],
      bcrAttestations,
      [{
        type: ConditionType.SCC_ENFORCEMENT,
        status: 'required'
      }]
    );
  }

  /**
   * Evaluate transfer under Article 49 (Derogations)
   */
  private async evaluateDerogation(
    request: TransferRequest, 
    requestId: string, 
    auditToken: string
  ): Promise<TransferResponse> {
    const derogationType = request.claimed_legal_basis;
    const constraints: TransferConstraint[] = [];

    // Evaluate specific derogation types
    switch (derogationType) {
      case LegalBasis.ART49_VITAL_INTERESTS:
        if (this.isVitalInterestsValid(request)) {
          constraints.push(
            {
              type: ConstraintType.SCOPE_LIMITATION,
              note: 'Use only for stated vital interest; no secondary use.'
            },
            {
              type: ConstraintType.RETENTION_LIMIT,
              days: 30
            },
            {
              type: ConstraintType.LOG_REQUIREMENT,
              note: 'Maintain detailed log for supervisory review.'
            }
          );

          return this.createConditionalAllowResponse(
            request,
            requestId,
            auditToken,
            LegalBasis.ART49_VITAL_INTERESTS,
            'Transfer permitted under Art. 49(1)(d): vital interests of the data subject. Use only for the stated purpose; document necessity and proportionality.',
            {
              rules: [
                'derogation:vital_interests==true',
                `purpose=='${request.processing_context.purpose}'`
              ],
              evidence: ['controller_statement:urgent_medical_need']
            },
            [{
              title: 'GDPR Art. 49(1)(d)',
              url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679',
              type: 'derogation'
            }],
            undefined,
            undefined,
            constraints
          );
        }
        break;

      case LegalBasis.ART49_PUBLIC_INTEREST:
        if (this.isPublicInterestValid(request)) {
          return this.createConditionalAllowResponse(
            request,
            requestId,
            auditToken,
            LegalBasis.ART49_PUBLIC_INTEREST,
            'Transfer permitted under Art. 49(1)(d): public interest. Ensure compliance with applicable laws and document necessity.',
            {
              rules: ['derogation:public_interest==true'],
              evidence: ['controller_statement:public_interest']
            },
            [{
              title: 'GDPR Art. 49(1)(d)',
              url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679',
              type: 'derogation'
            }],
            undefined,
            undefined,
            constraints
          );
        }
        break;

      case LegalBasis.ART49_CONSENT:
        constraints.push({
          type: ConstraintType.CONSENT_REQUIREMENT,
          note: 'Explicit consent required from data subject.'
        });

        return this.createConditionalAllowResponse(
          request,
          requestId,
          auditToken,
          LegalBasis.ART49_CONSENT,
          'Transfer permitted under Art. 49(1)(a): explicit consent. Ensure consent is specific, informed, and freely given.',
          {
            rules: ['derogation:consent==true'],
            evidence: ['data_subject_consent:explicit']
          },
          [{
            title: 'GDPR Art. 49(1)(a)',
            url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679',
            type: 'derogation'
          }],
          undefined,
          undefined,
          constraints
        );

      case LegalBasis.ART49_CONTRACT:
        constraints.push({
          type: ConstraintType.SCOPE_LIMITATION,
          note: 'Transfer necessary for contract performance with data subject.'
        });

        return this.createConditionalAllowResponse(
          request,
          requestId,
          auditToken,
          LegalBasis.ART49_CONTRACT,
          'Transfer permitted under Art. 49(1)(b): contract performance. Ensure transfer is necessary for contract with data subject.',
          {
            rules: ['derogation:contract==true'],
            evidence: ['contract_performance:necessary']
          },
          [{
            title: 'GDPR Art. 49(1)(b)',
            url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679',
            type: 'derogation'
          }],
          undefined,
          undefined,
          constraints
        );
    }

    return this.createDenyResponse(
      request,
      requestId,
      auditToken,
      derogationType,
      `Derogation ${derogationType} not applicable for this transfer.`,
      {
        rules: [`derogation:${derogationType}==false`],
        evidence: [`derogation_assessment:${derogationType}_failed`]
      }
    );
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getRequiredSCCModules(request: TransferRequest): string[] {
    // Determine required SCC modules based on transfer context
    // This is a simplified implementation - real logic would be more complex
    if (request.processing_context.special_categories) {
      return ['Module_Two', 'Module_Three']; // Controller-to-Processor, Processor-to-Processor
    }
    return ['Module_Two']; // Default to Controller-to-Processor
  }

  private isTIARequired(request: TransferRequest): boolean {
    // Transfer Impact Assessment required for certain transfers
    // Simplified logic - real implementation would check Schrems II requirements
    return request.destination_country === 'US' || 
           request.destination_country === 'CN' ||
           request.processing_context.special_categories;
  }

  private isVitalInterestsValid(request: TransferRequest): boolean {
    // Check if transfer is for vital interests (e.g., urgent medical care)
    const purpose = request.processing_context.purpose.toLowerCase();
    return purpose.includes('urgent') || 
           purpose.includes('emergency') || 
           purpose.includes('vital') ||
           purpose.includes('medical');
  }

  private isPublicInterestValid(request: TransferRequest): boolean {
    // Check if transfer is for public interest
    const purpose = request.processing_context.purpose.toLowerCase();
    return purpose.includes('public') || 
           purpose.includes('government') || 
           purpose.includes('regulatory');
  }

  private getCacheTTL(legalBasis: LegalBasis): number {
    switch (legalBasis) {
      case LegalBasis.ART45_ADEQUACY:
        return 86400; // 24 hours - adequacy decisions are stable
      case LegalBasis.ART46_SCC:
      case LegalBasis.ART46_BCR:
        return 3600; // 1 hour - vendor attestations can change
      case LegalBasis.ART49_DEROGATION:
      case LegalBasis.ART49_VITAL_INTERESTS:
      case LegalBasis.ART49_PUBLIC_INTEREST:
      case LegalBasis.ART49_LEGITIMATE_INTERESTS:
      case LegalBasis.ART49_CONSENT:
      case LegalBasis.ART49_CONTRACT:
        return 0; // No caching - derogations are case-specific
      default:
        return 300; // 5 minutes default
    }
  }

  private generateCacheKey(request: TransferRequest): string {
    const key = `${request.origin_country}-${request.destination_country}-${request.vendor_id}-${request.claimed_legal_basis}`;
    return Buffer.from(key).toString('base64');
  }

  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `cbdr_${timestamp}${random}`.toUpperCase();
  }

  private generateAuditToken(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `aud_${timestamp}${random}`.toUpperCase();
  }

  // ============================================================================
  // Response Creation Methods
  // ============================================================================

  private createAllowResponse(
    request: TransferRequest,
    requestId: string,
    auditToken: string,
    legalBasis: LegalBasis,
    rationale: string,
    machineRationale: MachineRationale,
    references?: RegulatoryReference[]
  ): TransferResponse {
    return {
      request_id: requestId,
      decision: TransferDecision.ALLOW,
      legal_basis_resolved: legalBasis,
      rationale,
      machine_rationale: machineRationale,
      references,
      audit: {
        audit_token: auditToken,
        timestamp: new Date().toISOString(),
        client_ref: request.client_ref
      },
      cache_ttl_seconds: this.getCacheTTL(legalBasis),
      signature: '' // Will be set by signing service
    };
  }

  private createConditionalAllowResponse(
    request: TransferRequest,
    requestId: string,
    auditToken: string,
    legalBasis: LegalBasis,
    rationale: string,
    machineRationale: MachineRationale,
    references?: RegulatoryReference[],
    vendorAttestations?: VendorAttestation[],
    conditions?: TransferCondition[],
    constraints?: TransferConstraint[]
  ): TransferResponse {
    return {
      request_id: requestId,
      decision: TransferDecision.CONDITIONAL_ALLOW,
      legal_basis_resolved: legalBasis,
      rationale,
      machine_rationale: machineRationale,
      references,
      vendor_attestations: vendorAttestations,
      conditions,
      constraints,
      audit: {
        audit_token: auditToken,
        timestamp: new Date().toISOString(),
        client_ref: request.client_ref
      },
      cache_ttl_seconds: this.getCacheTTL(legalBasis),
      signature: '' // Will be set by signing service
    };
  }

  private createDenyResponse(
    request: TransferRequest,
    requestId: string,
    auditToken: string,
    legalBasis: LegalBasis,
    rationale: string,
    machineRationale: MachineRationale,
    references?: RegulatoryReference[]
  ): TransferResponse {
    return {
      request_id: requestId,
      decision: TransferDecision.DENY,
      legal_basis_resolved: legalBasis,
      rationale,
      machine_rationale: machineRationale,
      references,
      audit: {
        audit_token: auditToken,
        timestamp: new Date().toISOString(),
        client_ref: request.client_ref
      },
      cache_ttl_seconds: 0, // No caching for denied requests
      signature: '' // Will be set by signing service
    };
  }
}
