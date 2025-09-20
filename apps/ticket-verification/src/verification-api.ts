import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { ethers } from "ethers";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

// Database connection
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});

// CanonTicketVerification contract ABI
const CANON_TICKET_ABI = [
  "function getTicketVerification(uint256) external view returns (uint8, address, tuple(string, string, uint256, uint256, string[], uint256, address, uint256), uint256)",
  "function getTicketHistory(uint256) external view returns (tuple(address, address, uint256, uint256, uint8, string, string)[])",
  "function getStats() external view returns (uint256, uint256, uint256, uint256)",
  "function createEscrow(uint256, address, uint256, uint256) external payable returns (uint256)",
  "function verifyAndCompleteEscrow(uint256, string) external",
  "function cancelEscrow(uint256) external",
  "function revokeTicket(uint256, string) external",
  "function markTicketUsed(uint256) external",
  "function updateBlacklist(address, bool, string) external",
  "function updateExchangeAuthorization(string, bool) external",
  "event TicketIssued(uint256 indexed, address indexed, string, uint256, address indexed)",
  "event TicketTransferred(uint256 indexed, address indexed, address indexed, uint256, uint8, string)",
  "event TicketRevoked(uint256 indexed, address indexed, string, uint256)",
  "event TicketScanned(uint256 indexed, address indexed, uint256)",
  "event EscrowCreated(uint256 indexed, uint256 indexed, address indexed, address, uint256)",
  "event EscrowCompleted(uint256 indexed, uint256 indexed, address indexed, address, uint256)",
  "event EscrowCancelled(uint256 indexed, uint256 indexed, address indexed, uint256)"
];

// Schemas
const TicketVerificationSchema = z.object({
  ticketId: z.string().min(1),
  buyerAddress: z.string().optional(),
  sellerAddress: z.string().optional()
});

const EscrowCreateSchema = z.object({
  ticketId: z.string().min(1),
  sellerAddress: z.string().min(1),
  amount: z.string().min(1),
  expiresAt: z.number().min(1)
});

const EscrowCompleteSchema = z.object({
  escrowId: z.string().min(1),
  verificationUri: z.string().min(1)
});

const TicketRevokeSchema = z.object({
  ticketId: z.string().min(1),
  reason: z.string().min(1)
});

// CanonTicketVerification client
class CanonTicketClient {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  
  constructor(rpcUrl: string, contractAddress: string, privateKey: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, CANON_TICKET_ABI, wallet);
  }
  
  async getTicketVerification(ticketId: string) {
    const [status, owner, metadata, historyLength] = await this.contract.getTicketVerification(ticketId);
    return {
      status: Number(status),
      owner,
      metadata: {
        eventId: metadata[0],
        seatLocation: metadata[1],
        originalPrice: Number(metadata[2]),
        maxResaleMarkup: Number(metadata[3]),
        authorizedExchanges: metadata[4],
        validUntil: Number(metadata[5]),
        issuer: metadata[6],
        issuedAt: Number(metadata[7])
      },
      historyLength: Number(historyLength)
    };
  }
  
  async getTicketHistory(ticketId: string) {
    const history = await this.contract.getTicketHistory(ticketId);
    return history.map((entry: any) => ({
      from: entry[0],
      to: entry[1],
      price: Number(entry[2]),
      timestamp: Number(entry[3]),
      compliance: Number(entry[4]),
      exchange: entry[5],
      evidenceUri: entry[6]
    }));
  }
  
  async getStats() {
    const [tickets, transfers, escrows, revocations] = await this.contract.getStats();
    return {
      tickets: Number(tickets),
      transfers: Number(transfers),
      escrows: Number(escrows),
      revocations: Number(revocations)
    };
  }
  
  async createEscrow(ticketId: string, sellerAddress: string, amount: string, expiresAt: number) {
    const tx = await this.contract.createEscrow(ticketId, sellerAddress, amount, expiresAt, {
      value: amount
    });
    return tx.hash;
  }
  
  async verifyAndCompleteEscrow(escrowId: string, verificationUri: string) {
    const tx = await this.contract.verifyAndCompleteEscrow(escrowId, verificationUri);
    return tx.hash;
  }
  
  async cancelEscrow(escrowId: string) {
    const tx = await this.contract.cancelEscrow(escrowId);
    return tx.hash;
  }
  
  async revokeTicket(ticketId: string, reason: string) {
    const tx = await this.contract.revokeTicket(ticketId, reason);
    return tx.hash;
  }
  
  async markTicketUsed(ticketId: string) {
    const tx = await this.contract.markTicketUsed(ticketId);
    return tx.hash;
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

// Verification API routes
export async function registerVerificationRoutes(app: FastifyInstance) {
  const canonClient = new CanonTicketClient(
    process.env.RPC_URL!,
    process.env.CANON_TICKET_ADDRESS!,
    process.env.RELAYER_PK!
  );
  
  // Health check
  app.get("/healthz", async () => ({ ok: true }));
  
  // Get complete ticket history (Carfax-like report)
  app.get("/tickets/:ticketId/history", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ticketId } = request.params as { ticketId: string };
      
      // Get ticket verification data
      const verification = await canonClient.getTicketVerification(ticketId);
      
      // Get complete transfer history
      const history = await canonClient.getTicketHistory(ticketId);
      
      // Calculate price analysis
      const priceAnalysis = calculatePriceAnalysis(verification.metadata.originalPrice, history);
      
      // Check compliance status
      const complianceStatus = checkComplianceStatus(history);
      
      // Generate Carfax-like report
      const report = {
        ticketId,
        currentStatus: getStatusText(verification.status),
        currentOwner: verification.owner,
        eventInfo: {
          eventId: verification.metadata.eventId,
          seatLocation: verification.metadata.seatLocation,
          originalPrice: verification.metadata.originalPrice,
          validUntil: new Date(verification.metadata.validUntil * 1000).toISOString()
        },
        transferRules: {
          maxResaleMarkup: verification.metadata.maxResaleMarkup,
          authorizedExchanges: verification.metadata.authorizedExchanges
        },
        ownershipHistory: history.map((entry, index) => ({
          transferNumber: index + 1,
          from: entry.from,
          to: entry.to,
          price: entry.price,
          markup: calculateMarkup(verification.metadata.originalPrice, entry.price),
          compliance: getComplianceText(entry.compliance),
          exchange: entry.exchange,
          timestamp: new Date(entry.timestamp * 1000).toISOString(),
          evidenceUri: entry.evidenceUri
        })),
        priceAnalysis,
        complianceStatus,
        riskAssessment: assessRisk(verification, history),
        generatedAt: new Date().toISOString()
      };
      
      return reply.send(report);
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Invalid ticket ID" });
    }
  });
  
  // Get current ticket status
  app.get("/tickets/:ticketId/status", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ticketId } = request.params as { ticketId: string };
      
      const verification = await canonClient.getTicketVerification(ticketId);
      
      return reply.send({
        ticketId,
        status: getStatusText(verification.status),
        owner: verification.owner,
        eventId: verification.metadata.eventId,
        seatLocation: verification.metadata.seatLocation,
        originalPrice: verification.metadata.originalPrice,
        validUntil: new Date(verification.metadata.validUntil * 1000).toISOString(),
        transferCount: verification.historyLength,
        checkedAt: new Date().toISOString()
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Invalid ticket ID" });
    }
  });
  
  // Verify ticket before purchase
  app.post("/tickets/:ticketId/verify", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ticketId } = request.params as { ticketId: string };
      const body = TicketVerificationSchema.parse(request.body);
      
      const verification = await canonClient.getTicketVerification(ticketId);
      const history = await canonClient.getTicketHistory(ticketId);
      
      // Perform comprehensive verification
      const verificationResult = {
        ticketId,
        isValid: verification.status === 0, // VALID
        currentOwner: verification.owner,
        sellerVerified: body.sellerAddress ? body.sellerAddress.toLowerCase() === verification.owner.toLowerCase() : true,
        priceCompliant: true, // Will be checked against proposed price
        exchangeCompliant: true, // Will be checked against proposed exchange
        riskLevel: assessRisk(verification, history),
        warnings: [],
        recommendations: []
      };
      
      // Check for warnings
      if (verification.status !== 0) {
        verificationResult.warnings.push(`Ticket status: ${getStatusText(verification.status)}`);
      }
      
      if (history.length > 5) {
        verificationResult.warnings.push("High transfer count - verify authenticity");
      }
      
      const recentTransfers = history.filter(h => 
        Date.now() - (h.timestamp * 1000) < 24 * 60 * 60 * 1000
      );
      if (recentTransfers.length > 2) {
        verificationResult.warnings.push("Multiple recent transfers - potential fraud risk");
      }
      
      // Generate recommendations
      if (verificationResult.riskLevel === "HIGH") {
        verificationResult.recommendations.push("Consider using escrow for this purchase");
      }
      
      if (verificationResult.warnings.length > 0) {
        verificationResult.recommendations.push("Review ticket history carefully before purchasing");
      }
      
      return reply.send(verificationResult);
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Verification failed" });
    }
  });
  
  // Create escrow for ticket purchase
  app.post("/escrow/create", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = EscrowCreateSchema.parse(request.body);
      
      // Pin escrow evidence
      const evidence = {
        ticketId: body.ticketId,
        sellerAddress: body.sellerAddress,
        amount: body.amount,
        expiresAt: body.expiresAt,
        createdAt: new Date().toISOString(),
        buyerAddress: request.headers["x-buyer-address"] as string
      };
      const evidenceUri = await pinEvidence(evidence);
      
      // Create escrow on blockchain
      const canonTx = await canonClient.createEscrow(
        body.ticketId,
        body.sellerAddress,
        body.amount,
        body.expiresAt
      );
      
      return reply.send({
        escrowId: "pending", // Will be updated when transaction is mined
        ticketId: body.ticketId,
        canonTx,
        evidenceUri,
        status: "created"
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Escrow creation failed" });
    }
  });
  
  // Complete escrow after verification
  app.post("/escrow/:escrowId/complete", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { escrowId } = request.params as { escrowId: string };
      const body = EscrowCompleteSchema.parse(request.body);
      
      const canonTx = await canonClient.verifyAndCompleteEscrow(escrowId, body.verificationUri);
      
      return reply.send({
        escrowId,
        canonTx,
        status: "completed"
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Escrow completion failed" });
    }
  });
  
  // Cancel escrow
  app.post("/escrow/:escrowId/cancel", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { escrowId } = request.params as { escrowId: string };
      
      const canonTx = await canonClient.cancelEscrow(escrowId);
      
      return reply.send({
        escrowId,
        canonTx,
        status: "cancelled"
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Escrow cancellation failed" });
    }
  });
  
  // Revoke ticket (venue only)
  app.post("/tickets/:ticketId/revoke", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ticketId } = request.params as { ticketId: string };
      const body = TicketRevokeSchema.parse(request.body);
      
      const canonTx = await canonClient.revokeTicket(ticketId, body.reason);
      
      return reply.send({
        ticketId,
        canonTx,
        status: "revoked",
        reason: body.reason
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Ticket revocation failed" });
    }
  });
  
  // Mark ticket as used (venue only)
  app.post("/tickets/:ticketId/scan", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ticketId } = request.params as { ticketId: string };
      
      const canonTx = await canonClient.markTicketUsed(ticketId);
      
      return reply.send({
        ticketId,
        canonTx,
        status: "used",
        scannedAt: new Date().toISOString()
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(400).send({ error: "Ticket scanning failed" });
    }
  });
  
  // Get system statistics
  app.get("/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await canonClient.getStats();
      return reply.send(stats);
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ error: "Failed to get statistics" });
    }
  });
}

// Helper functions
function getStatusText(status: number): string {
  const statuses = ["VALID", "REVOKED", "USED", "EXPIRED", "FRAUDULENT"];
  return statuses[status] || "UNKNOWN";
}

function getComplianceText(compliance: number): string {
  const compliances = ["COMPLIANT", "MARKUP_VIOLATION", "UNAUTHORIZED_EXCHANGE", "BLACKLISTED_SELLER", "RULE_VIOLATION"];
  return compliances[compliance] || "UNKNOWN";
}

function calculateMarkup(originalPrice: number, currentPrice: number): number {
  return Math.round(((currentPrice - originalPrice) / originalPrice) * 100);
}

function calculatePriceAnalysis(originalPrice: number, history: any[]): any {
  if (history.length === 0) {
    return {
      currentPrice: originalPrice,
      totalMarkup: 0,
      averagePrice: originalPrice,
      priceTrend: "stable",
      maxPrice: originalPrice,
      minPrice: originalPrice
    };
  }
  
  const prices = history.map(h => h.price);
  const currentPrice = prices[prices.length - 1];
  const totalMarkup = calculateMarkup(originalPrice, currentPrice);
  const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  
  let priceTrend = "stable";
  if (prices.length > 1) {
    const recent = prices.slice(-3);
    const older = prices.slice(-6, -3);
    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      if (recentAvg > olderAvg * 1.1) priceTrend = "rising";
      else if (recentAvg < olderAvg * 0.9) priceTrend = "falling";
    }
  }
  
  return {
    currentPrice,
    totalMarkup,
    averagePrice,
    priceTrend,
    maxPrice: Math.max(...prices),
    minPrice: Math.min(...prices),
    priceHistory: prices
  };
}

function checkComplianceStatus(history: any[]): any {
  const violations = history.filter(h => h.compliance !== 0);
  const complianceRate = history.length > 0 ? ((history.length - violations.length) / history.length) * 100 : 100;
  
  return {
    complianceRate,
    totalViolations: violations.length,
    violationTypes: violations.reduce((acc, v) => {
      acc[getComplianceText(v.compliance)] = (acc[getComplianceText(v.compliance)] || 0) + 1;
      return acc;
    }, {}),
    lastViolation: violations.length > 0 ? violations[violations.length - 1] : null
  };
}

function assessRisk(verification: any, history: any[]): string {
  let riskScore = 0;
  
  // Status risk
  if (verification.status !== 0) riskScore += 50;
  
  // Transfer count risk
  if (history.length > 10) riskScore += 20;
  else if (history.length > 5) riskScore += 10;
  
  // Recent activity risk
  const recentTransfers = history.filter(h => 
    Date.now() - (h.timestamp * 1000) < 24 * 60 * 60 * 1000
  );
  if (recentTransfers.length > 3) riskScore += 30;
  else if (recentTransfers.length > 1) riskScore += 15;
  
  // Compliance risk
  const violations = history.filter(h => h.compliance !== 0);
  if (violations.length > 0) riskScore += 25;
  
  // Price volatility risk
  if (history.length > 2) {
    const prices = history.map(h => h.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const volatility = (maxPrice - minPrice) / minPrice;
    if (volatility > 0.5) riskScore += 20;
  }
  
  if (riskScore >= 70) return "HIGH";
  if (riskScore >= 40) return "MEDIUM";
  return "LOW";
}
