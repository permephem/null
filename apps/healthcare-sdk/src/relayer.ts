import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { ethers } from "ethers";
import { createHash } from "node:crypto";

// Healthcare-specific schemas
const ConsentGrantSchema = z.object({
  patientId: z.string().min(1),
  purpose: z.enum(["treatment", "research", "billing", "quality_assurance"]),
  dataTypes: z.array(z.string()),
  expirationDate: z.string().optional(),
  evidence: z.record(z.any()).optional()
});

const ConsentRevokeSchema = z.object({
  patientId: z.string().min(1),
  purpose: z.enum(["treatment", "research", "billing", "quality_assurance"]),
  reason: z.string().optional(),
  evidence: z.record(z.any()).optional()
});

const RecordAnchorSchema = z.object({
  patientId: z.string().min(1),
  recordType: z.enum(["diagnosis", "treatment", "medication", "lab_result", "imaging"]),
  recordHash: z.string(),
  providerId: z.string().min(1),
  assurance: z.number().min(0).max(4),
  evidence: z.record(z.any()).optional()
});

const TrialConsentSchema = z.object({
  patientId: z.string().min(1),
  trialId: z.string().min(1),
  consentType: z.enum(["participation", "data_sharing", "genetic_testing"]),
  evidence: z.record(z.any()).optional()
});

const AccessLogSchema = z.object({
  patientId: z.string().min(1),
  recordHash: z.string(),
  accessorId: z.string().min(1),
  purpose: z.string(),
  evidence: z.record(z.any()).optional()
});

// HIPAA-compliant data handling
class HIPAACompliantHandler {
  private auditLog: any[] = [];
  
  // Create patient commitment (no PHI)
  createPatientCommit(patientId: string, salt: string): string {
    const combined = patientId + salt;
    return createHash('sha256').update(combined).digest('hex');
  }
  
  // Create record commitment
  createRecordCommit(recordHash: string, patientId: string): string {
    const combined = recordHash + patientId;
    return createHash('sha256').update(combined).digest('hex');
  }
  
  // Create consent commitment
  createConsentCommit(patientId: string, purpose: string, timestamp: string): string {
    const combined = patientId + purpose + timestamp;
    return createHash('sha256').update(combined).digest('hex');
  }
  
  // Create provider commitment
  createProviderCommit(providerId: string, salt: string): string {
    const combined = providerId + salt;
    return createHash('sha256').update(combined).digest('hex');
  }
  
  // Log audit event
  logAuditEvent(event: any) {
    this.auditLog.push({
      ...event,
      timestamp: new Date().toISOString(),
      ip: event.ip || 'unknown',
      userAgent: event.userAgent || 'unknown'
    });
  }
  
  // Get audit log
  getAuditLog(): any[] {
    return this.auditLog;
  }
}

// CanonHealth contract interface
class CanonHealthClient {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  
  constructor(rpcUrl: string, contractAddress: string, privateKey: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, this.provider);
    
    const abi = [
      "function anchorHealthcareEvent(bytes32,bytes32,bytes32,bytes32,uint8,uint8,string) external",
      "function hasPatientConsent(bytes32) external view returns (bool)",
      "function getLastAccessTime(bytes32) external view returns (uint256)",
      "function getProviderActivity(address) external view returns (uint256)",
      "function getStats() external view returns (uint256,uint256,uint256)"
    ];
    
    this.contract = new ethers.Contract(contractAddress, abi, wallet);
  }
  
  async anchorHealthcareEvent(
    patientCommit: string,
    recordCommit: string,
    consentCommit: string,
    providerCommit: string,
    operation: number,
    assurance: number,
    evidenceUri: string
  ) {
    const tx = await this.contract.anchorHealthcareEvent(
      patientCommit,
      recordCommit,
      consentCommit,
      providerCommit,
      operation,
      assurance,
      evidenceUri
    );
    return tx.hash;
  }
  
  async hasPatientConsent(patientCommit: string): Promise<boolean> {
    return await this.contract.hasPatientConsent(patientCommit);
  }
  
  async getLastAccessTime(recordCommit: string): Promise<number> {
    return await this.contract.getLastAccessTime(recordCommit);
  }
  
  async getProviderActivity(provider: string): Promise<number> {
    return await this.contract.getProviderActivity(provider);
  }
  
  async getStats(): Promise<{events: number, consents: number, breaches: number}> {
    const [events, consents, breaches] = await this.contract.getStats();
    return { events: Number(events), consents: Number(consents), breaches: Number(breaches) };
  }
}

// IPFS evidence pinning
async function pinEvidence(evidence: any): Promise<string> {
  const pinnerBase = process.env.PINNER_BASE || "http://localhost:8789";
  const token = process.env.PINNER_TOKEN || "";
  
  const response = await fetch(`${pinnerBase}/pin/json`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(evidence)
  });
  
  if (!response.ok) {
    throw new Error(`Pin failed: ${response.status} ${await response.text()}`);
  }
  
  const result = await response.json();
  return result.uri;
}

// Healthcare relayer routes
export async function registerHealthcareRoutes(app: FastifyInstance) {
  const hipaaHandler = new HIPAACompliantHandler();
  const canonClient = new CanonHealthClient(
    process.env.RPC_URL!,
    process.env.CANON_HEALTH_ADDRESS!,
    process.env.RELAYER_PK!
  );
  
  // Health check
  app.get("/healthz", async () => ({ ok: true }));
  
  // Grant patient consent
  app.post("/consent/grant", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = ConsentGrantSchema.parse(request.body);
      
      // Create commitments (no PHI)
      const patientCommit = hipaaHandler.createPatientCommit(body.patientId, process.env.PATIENT_SALT!);
      const consentCommit = hipaaHandler.createConsentCommit(
        body.patientId,
        body.purpose,
        new Date().toISOString()
      );
      const providerCommit = hipaaHandler.createProviderCommit(
        request.headers["x-provider-id"] as string,
        process.env.PROVIDER_SALT!
      );
      
      // Pin evidence to IPFS
      const evidence = {
        purpose: body.purpose,
        dataTypes: body.dataTypes,
        expirationDate: body.expirationDate,
        timestamp: new Date().toISOString(),
        ...body.evidence
      };
      const evidenceUri = await pinEvidence(evidence);
      
      // Anchor to CanonHealth
      const canonTx = await canonClient.anchorHealthcareEvent(
        patientCommit,
        "0x0000000000000000000000000000000000000000000000000000000000000000", // No record for consent
        consentCommit,
        providerCommit,
        0, // CONSENT_GRANT
        2, // VERIFIED
        evidenceUri
      );
      
      // Log audit event
      hipaaHandler.logAuditEvent({
        action: "consent_granted",
        patientId: body.patientId,
        purpose: body.purpose,
        canonTx,
        ip: request.ip,
        userAgent: request.headers["user-agent"]
      });
      
      return reply.send({
        patientCommit,
        consentCommit,
        canonTx,
        evidenceUri
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Invalid request" });
    }
  });
  
  // Revoke patient consent
  app.post("/consent/revoke", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = ConsentRevokeSchema.parse(request.body);
      
      // Create commitments
      const patientCommit = hipaaHandler.createPatientCommit(body.patientId, process.env.PATIENT_SALT!);
      const consentCommit = hipaaHandler.createConsentCommit(
        body.patientId,
        body.purpose,
        new Date().toISOString()
      );
      const providerCommit = hipaaHandler.createProviderCommit(
        request.headers["x-provider-id"] as string,
        process.env.PROVIDER_SALT!
      );
      
      // Pin evidence
      const evidence = {
        purpose: body.purpose,
        reason: body.reason,
        timestamp: new Date().toISOString(),
        ...body.evidence
      };
      const evidenceUri = await pinEvidence(evidence);
      
      // Anchor to CanonHealth
      const canonTx = await canonClient.anchorHealthcareEvent(
        patientCommit,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        consentCommit,
        providerCommit,
        1, // CONSENT_REVOKE
        2, // VERIFIED
        evidenceUri
      );
      
      // Log audit event
      hipaaHandler.logAuditEvent({
        action: "consent_revoked",
        patientId: body.patientId,
        purpose: body.purpose,
        canonTx,
        ip: request.ip,
        userAgent: request.headers["user-agent"]
      });
      
      return reply.send({
        patientCommit,
        consentCommit,
        canonTx,
        evidenceUri
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Invalid request" });
    }
  });
  
  // Check consent status
  app.get("/consent/status/:patientId", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { patientId } = request.params as { patientId: string };
      
      const patientCommit = hipaaHandler.createPatientCommit(patientId, process.env.PATIENT_SALT!);
      const hasConsent = await canonClient.hasPatientConsent(patientCommit);
      
      return reply.send({
        patientId,
        hasConsent,
        checkedAt: new Date().toISOString()
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Invalid request" });
    }
  });
  
  // Anchor medical record
  app.post("/records/anchor", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = RecordAnchorSchema.parse(request.body);
      
      // Create commitments
      const patientCommit = hipaaHandler.createPatientCommit(body.patientId, process.env.PATIENT_SALT!);
      const recordCommit = hipaaHandler.createRecordCommit(body.recordHash, body.patientId);
      const providerCommit = hipaaHandler.createProviderCommit(
        request.headers["x-provider-id"] as string,
        process.env.PROVIDER_SALT!
      );
      
      // Pin evidence
      const evidence = {
        recordType: body.recordType,
        recordHash: body.recordHash,
        providerId: body.providerId,
        timestamp: new Date().toISOString(),
        ...body.evidence
      };
      const evidenceUri = await pinEvidence(evidence);
      
      // Anchor to CanonHealth
      const canonTx = await canonClient.anchorHealthcareEvent(
        patientCommit,
        recordCommit,
        "0x0000000000000000000000000000000000000000000000000000000000000000", // No consent for record
        providerCommit,
        2, // RECORD_ANCHOR
        body.assurance,
        evidenceUri
      );
      
      // Log audit event
      hipaaHandler.logAuditEvent({
        action: "record_anchored",
        patientId: body.patientId,
        recordType: body.recordType,
        recordHash: body.recordHash,
        canonTx,
        ip: request.ip,
        userAgent: request.headers["user-agent"]
      });
      
      return reply.send({
        patientCommit,
        recordCommit,
        canonTx,
        evidenceUri
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Invalid request" });
    }
  });
  
  // Log data access
  app.post("/access/log", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = AccessLogSchema.parse(request.body);
      
      // Create commitments
      const patientCommit = hipaaHandler.createPatientCommit(body.patientId, process.env.PATIENT_SALT!);
      const recordCommit = hipaaHandler.createRecordCommit(body.recordHash, body.patientId);
      const providerCommit = hipaaHandler.createProviderCommit(
        request.headers["x-provider-id"] as string,
        process.env.PROVIDER_SALT!
      );
      
      // Pin evidence
      const evidence = {
        accessorId: body.accessorId,
        purpose: body.purpose,
        timestamp: new Date().toISOString(),
        ...body.evidence
      };
      const evidenceUri = await pinEvidence(evidence);
      
      // Anchor to CanonHealth
      const canonTx = await canonClient.anchorHealthcareEvent(
        patientCommit,
        recordCommit,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        providerCommit,
        6, // ACCESS_LOG
        1, // BASIC
        evidenceUri
      );
      
      // Log audit event
      hipaaHandler.logAuditEvent({
        action: "data_accessed",
        patientId: body.patientId,
        recordHash: body.recordHash,
        accessorId: body.accessorId,
        purpose: body.purpose,
        canonTx,
        ip: request.ip,
        userAgent: request.headers["user-agent"]
      });
      
      return reply.send({
        patientCommit,
        recordCommit,
        canonTx,
        evidenceUri
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Invalid request" });
    }
  });
  
  // Get audit log
  app.get("/audit/log", async (request: FastifyRequest, reply: FastifyReply) => {
    const auditLog = hipaaHandler.getAuditLog();
    return reply.send({
      auditLog,
      totalEvents: auditLog.length
    });
  });
  
  // Get CanonHealth stats
  app.get("/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    const stats = await canonClient.getStats();
    return reply.send(stats);
  });
}
