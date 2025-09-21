/**
 * Cross-Border Data Regulation (CBDR) Types
 * 
 * Defines the core data structures for GDPR compliance checking
 * for international data transfers.
 */

// ============================================================================
// Core Transfer Request/Response Types
// ============================================================================

export interface TransferRequest {
  origin_country: string;           // ISO 3166-1 alpha-2 country code
  destination_country: string;      // ISO 3166-1 alpha-2 country code
  vendor_id: string;                // Vendor identifier (e.g., "aws", "azure")
  processing_context: ProcessingContext;
  claimed_legal_basis: LegalBasis;
  transfer_date: string;            // ISO 8601 timestamp
  client_ref?: string;              // Client reference for tracking
}

export interface ProcessingContext {
  controller: string;               // Data controller name
  purpose: string;                  // Processing purpose
  data_categories: DataCategory[];
  special_categories: boolean;      // Special category data (Art. 9 GDPR)
}

export interface TransferResponse {
  request_id: string;               // Unique request identifier
  decision: TransferDecision;
  legal_basis_resolved: LegalBasis;
  rationale: string;                // Human-readable explanation
  machine_rationale: MachineRationale;
  references?: RegulatoryReference[];
  vendor_attestations?: VendorAttestation[];
  conditions?: TransferCondition[];
  constraints?: TransferConstraint[];
  audit: AuditInfo;
  cache_ttl_seconds: number;
  signature: string;                // JWS signature
}

// ============================================================================
// Legal Basis and Decision Types
// ============================================================================

export enum LegalBasis {
  ART45_ADEQUACY = "ART45_ADEQUACY",
  ART46_SCC = "ART46_SCC", 
  ART46_BCR = "ART46_BCR",
  ART49_DEROGATION = "ART49_DEROGATION",
  ART49_VITAL_INTERESTS = "ART49_VITAL_INTERESTS",
  ART49_PUBLIC_INTEREST = "ART49_PUBLIC_INTEREST",
  ART49_LEGITIMATE_INTERESTS = "ART49_LEGITIMATE_INTERESTS",
  ART49_CONSENT = "ART49_CONSENT",
  ART49_CONTRACT = "ART49_CONTRACT"
}

export enum TransferDecision {
  ALLOW = "ALLOW",
  CONDITIONAL_ALLOW = "CONDITIONAL_ALLOW", 
  DENY = "DENY"
}

export enum DataCategory {
  PERSONAL_DATA = "personal_data",
  CONTACT_DETAILS = "contact_details",
  HEALTH_DATA = "health_data",
  FINANCIAL_DATA = "financial_data",
  BIOMETRIC_DATA = "biometric_data",
  LOCATION_DATA = "location_data",
  BEHAVIORAL_DATA = "behavioral_data"
}

// ============================================================================
// Machine Rationale and Evidence
// ============================================================================

export interface MachineRationale {
  rules: string[];                  // Applied decision rules
  evidence: string[];               // Evidence references
  confidence?: number;              // Decision confidence (0-100)
}

export interface RegulatoryReference {
  title: string;
  url: string;
  type?: "adequacy" | "scc" | "derogation" | "guidance";
  effective_date?: string;
  expiry_date?: string;
}

// ============================================================================
// Vendor Attestation System
// ============================================================================

export interface VendorAttestation {
  vendor_id: string;
  program: AttestationProgram;
  status: AttestationStatus;
  attestation_id: string;
  issued_date: string;
  expiry_date?: string;
  modules?: SCCModule[];
  certifications?: string[];
}

export enum AttestationProgram {
  SCC_MOD1 = "SCC_Mod1",           // Controller-to-Controller
  SCC_MOD2 = "SCC_Mod2",           // Controller-to-Processor  
  SCC_MOD3 = "SCC_Mod3",           // Processor-to-Processor
  SCC_MOD4 = "SCC_Mod4",           // Processor-to-Controller
  BCR = "BCR",                     // Binding Corporate Rules
  DPF = "DPF",                     // Data Privacy Framework
  PRIVACY_SHIELD = "PRIVACY_SHIELD" // Legacy Privacy Shield
}

export enum AttestationStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  SUSPENDED = "suspended",
  REVOKED = "revoked"
}

export enum SCCModule {
  MODULE_ONE = "Module_One",       // Controller-to-Controller
  MODULE_TWO = "Module_Two",       // Controller-to-Processor
  MODULE_THREE = "Module_Three",   // Processor-to-Processor
  MODULE_FOUR = "Module_Four"      // Processor-to-Controller
}

// ============================================================================
// Transfer Conditions and Constraints
// ============================================================================

export interface TransferCondition {
  type: ConditionType;
  status: "required" | "optional" | "satisfied";
  name?: string;
  description?: string;
}

export enum ConditionType {
  SCC_ENFORCEMENT = "SCC_ENFORCEMENT",
  TIA_PROFILE = "TIA_PROFILE",
  ADDITIONAL_SAFEGUARDS = "ADDITIONAL_SAFEGUARDS",
  DATA_SUBJECT_RIGHTS = "DATA_SUBJECT_RIGHTS",
  SUPERVISORY_AUTHORITY = "SUPERVISORY_AUTHORITY"
}

export interface TransferConstraint {
  type: ConstraintType;
  note?: string;
  days?: number;                   // For retention limits
  scope?: string;                  // For scope limitations
}

export enum ConstraintType {
  SCOPE_LIMITATION = "SCOPE_LIMITATION",
  RETENTION_LIMIT = "RETENTION_LIMIT", 
  LOG_REQUIREMENT = "LOG_REQUIREMENT",
  NOTIFICATION_REQUIREMENT = "NOTIFICATION_REQUIREMENT",
  CONSENT_REQUIREMENT = "CONSENT_REQUIREMENT"
}

// ============================================================================
// Audit and Compliance
// ============================================================================

export interface AuditInfo {
  audit_token: string;             // Unique audit identifier
  timestamp: string;               // ISO 8601 timestamp
  client_ref?: string;             // Client reference
  regulatory_jurisdiction?: string; // Relevant supervisory authority
}

export interface WebhookEvent {
  event: WebhookEventType;
  request_id: string;
  audit_token: string;
  decision: TransferDecision;
  legal_basis_resolved: LegalBasis;
  controller: string;
  vendor_id: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export enum WebhookEventType {
  TRANSFER_CHECK_LOGGED = "TRANSFER_CHECK_LOGGED",
  REGULATORY_UPDATE = "REGULATORY_UPDATE",
  VENDOR_ATTESTATION_CHANGE = "VENDOR_ATTESTATION_CHANGE",
  POLICY_UPDATE = "POLICY_UPDATE"
}

// ============================================================================
// Regulatory Data Sources
// ============================================================================

export interface AdequacyDecision {
  country_code: string;
  status: "adequate" | "inadequate" | "pending";
  decision_date: string;
  reference: string;
  url: string;
  notes?: string;
}

export interface SCCUpdate {
  version: string;
  effective_date: string;
  modules: SCCModule[];
  changes: string[];
  reference: string;
  url: string;
}

export interface RegulatoryUpdate {
  id: string;
  type: "adequacy" | "scc" | "guidance" | "framework";
  title: string;
  description: string;
  effective_date: string;
  source: string;
  url: string;
  impact: "high" | "medium" | "low";
  affected_countries?: string[];
  affected_vendors?: string[];
}

// ============================================================================
// Cache and Performance
// ============================================================================

export interface CacheEntry {
  key: string;
  value: TransferResponse;
  ttl_seconds: number;
  created_at: number;
  regulatory_version: string;
}

export interface CacheInvalidation {
  type: "regulatory_update" | "vendor_change" | "manual";
  reason: string;
  affected_keys: string[];
  timestamp: string;
}

// ============================================================================
// Error Handling
// ============================================================================

export interface CBDRError {
  code: string;
  message: string;
  details?: Record<string, any>;
  request_id?: string;
  timestamp: string;
}

export enum ErrorCode {
  INVALID_COUNTRY_CODE = "INVALID_COUNTRY_CODE",
  UNKNOWN_VENDOR = "UNKNOWN_VENDOR",
  INVALID_LEGAL_BASIS = "INVALID_LEGAL_BASIS",
  REGULATORY_DATA_UNAVAILABLE = "REGULATORY_DATA_UNAVAILABLE",
  VENDOR_ATTESTATION_EXPIRED = "VENDOR_ATTESTATION_EXPIRED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR = "INTERNAL_ERROR"
}

// ============================================================================
// Configuration and Environment
// ============================================================================

export interface CBDRConfig {
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  regulatory: {
    update_interval_hours: number;
    sources: string[];
  };
  cache: {
    default_ttl_seconds: number;
    adequacy_ttl_seconds: number;
    scc_ttl_seconds: number;
    derogation_ttl_seconds: number;
  };
  security: {
    jws_secret: string;
    api_key_required: boolean;
    rate_limit_per_minute: number;
  };
  webhooks: {
    enabled: boolean;
    endpoints: string[];
    retry_attempts: number;
  };
}

// ============================================================================
// Database Schema Types
// ============================================================================

export interface TransferLog {
  id: string;
  request_id: string;
  origin_country: string;
  destination_country: string;
  vendor_id: string;
  controller: string;
  decision: TransferDecision;
  legal_basis: LegalBasis;
  rationale: string;
  audit_token: string;
  client_ref?: string;
  created_at: Date;
  signature: string;
}

export interface VendorRegistry {
  vendor_id: string;
  name: string;
  website: string;
  attestations: VendorAttestation[];
  created_at: Date;
  updated_at: Date;
  status: "active" | "suspended" | "revoked";
}

export interface RegulatoryData {
  id: string;
  type: string;
  country_code?: string;
  data: any;
  effective_date: Date;
  expiry_date?: Date;
  source: string;
  created_at: Date;
  updated_at: Date;
}
