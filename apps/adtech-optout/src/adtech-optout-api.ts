import Fastify, { FastifyInstance } from 'fastify';
import { ethers } from 'ethers';
import { z } from 'zod';

// Types
interface ConsumerOptOut {
  consumerId: string;
  optOutType: number;
  status: number;
  createdAt: number;
  verifiedAt: number;
  expiresAt: number;
  evidenceUri: string;
  verifier: string;
}

interface AdNetwork {
  name: string;
  domain: string;
  compliant: boolean;
  violations: number;
  lastViolation: number;
  blacklisted: boolean;
  registeredAt: number;
}

interface ViolationReport {
  reportId: string;
  consumerId: string;
  adNetwork: string;
  violationType: string;
  evidenceUri: string;
  reportedAt: number;
  verified: boolean;
  penalty: number;
  verifiedBy: string;
}

interface MonitoringSession {
  sessionId: string;
  consumerId: string;
  adNetwork: string;
  status: number;
  startedAt: number;
  endedAt: number;
  evidenceUri: string;
  violationDetected: boolean;
  violationType: string;
}

interface ComplianceScore {
  adNetwork: string;
  score: number;
  totalChecks: number;
  violations: number;
  lastCheck: number;
  certified: boolean;
  certificationExpiry: number;
}

// Validation schemas
const RegisterOptOutSchema = z.object({
  consumerInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    deviceId: z.string().optional(),
    browserFingerprint: z.string().optional()
  }),
  optOutType: z.enum(['nai', 'daa', 'gpc', 'ccpa', 'gdpr', 'custom']),
  evidence: z.object({
    optOutScreenshot: z.string().optional(),
    optOutConfirmation: z.string().optional(),
    timestamp: z.string(),
    userAgent: z.string(),
    ipAddress: z.string().optional()
  }),
  preferences: z.object({
    expiresAt: z.number().optional(),
    notifyOnViolation: z.boolean().default(true),
    allowMonitoring: z.boolean().default(true)
  })
});

const ReportViolationSchema = z.object({
  consumerId: z.string(),
  adNetwork: z.string(),
  violationType: z.enum([
    'tracking_after_optout',
    'retargeting_after_optout',
    'data_collection_after_optout',
    'ad_serving_after_optout',
    'cross_site_tracking',
    'fingerprinting_after_optout'
  ]),
  evidence: z.object({
    screenshot: z.string(),
    networkRequests: z.string().optional(),
    cookies: z.string().optional(),
    localStorage: z.string().optional(),
    timestamp: z.string(),
    url: z.string(),
    userAgent: z.string()
  }),
  severity: z.number().min(1).max(10).default(5)
});

const StartMonitoringSchema = z.object({
  consumerId: z.string(),
  adNetwork: z.string(),
  monitoringType: z.enum(['passive', 'active', 'comprehensive']),
  duration: z.number().min(1).max(30).default(7), // days
  rules: z.array(z.string()).optional()
});

// Contract interfaces
const AdtechOptOutRegistryABI = [
  "function registerOptOut(bytes32,uint8,string,uint256) external returns (bytes32)",
  "function verifyOptOut(bytes32,uint256) external",
  "function reportViolation(bytes32,string,string,string) external returns (bytes32)",
  "function verifyViolation(bytes32,uint256,bool) external",
  "function registerAdNetwork(string,string,bool) external",
  "function getConsumerOptOuts(bytes32) external view returns (tuple(bytes32,uint8,uint8,uint256,uint256,uint256,string,address)[])",
  "function getViolationReport(bytes32) external view returns (tuple(bytes32,bytes32,string,string,string,uint256,bool,uint256,address))",
  "function getAdNetwork(string) external view returns (tuple(string,string,bool,uint256,uint256,bool,uint256))",
  "function hasActiveOptOut(bytes32,uint8) external view returns (bool)",
  "function getStats() external view returns (uint256,uint256,uint256,uint256)",
  "event OptOutRegistered(bytes32,uint8,string,uint256)",
  "event ViolationReported(bytes32,bytes32,string,string,string)",
  "event ViolationVerified(bytes32,bytes32,string,uint256,bool)"
];

const ComplianceMonitoringABI = [
  "function createMonitoringRule(string,string,uint256) external returns (bytes32)",
  "function startMonitoringSession(bytes32,string) external returns (bytes32)",
  "function endMonitoringSession(bytes32,bool,string,string) external",
  "function detectViolation(bytes32,string,string,string,uint256) external returns (bytes32)",
  "function verifyViolationDetection(bytes32,bool) external",
  "function updateComplianceScore(string,uint256,uint256,bool) external",
  "function getMonitoringSession(bytes32) external view returns (tuple(bytes32,bytes32,string,uint8,uint256,uint256,string,bool,string))",
  "function getComplianceScore(string) external view returns (tuple(string,uint256,uint256,uint256,uint256,bool,uint256))",
  "function getStats() external view returns (uint256,uint256,uint256,uint256)",
  "event MonitoringSessionStarted(bytes32,bytes32,string,uint256)",
  "event ViolationDetected(bytes32,bytes32,bytes32,string,string,string)"
];

const AdtechConsumerProtectionPoolABI = [
  "function submitClaim(bytes32,string,uint256,string) external payable returns (bytes32)",
  "function approveClaim(bytes32,string) external",
  "function payClaim(bytes32) external",
  "function imposePenalty(string,uint256,string,string) external payable",
  "function payPenalty(string,uint256) external payable",
  "function createCompensationPolicy(string,uint256,uint256) external",
  "function getConsumerClaim(bytes32) external view returns (tuple(bytes32,bytes32,string,uint256,string,uint256,bool,bool,address,string))",
  "function getNetworkPenalties(string) external view returns (tuple(string,uint256,string,uint256,bool,address,string)[])",
  "function calculateCompensation(string,uint256) external view returns (uint256)",
  "function getPoolStats() external view returns (uint256,uint256,uint256,uint256,uint256)",
  "event ClaimSubmitted(bytes32,bytes32,string,uint256,string)",
  "event ClaimApproved(bytes32,bytes32,uint256,address,string)",
  "event PenaltyImposed(string,uint256,string,uint256,address)"
];

// Utility functions
function hashConsumerId(consumerInfo: any): string {
  const consumerString = JSON.stringify(consumerInfo);
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(consumerString + process.env.ADTECH_SALT));
}

async function pinToIPFS(data: any): Promise<string> {
  // Implementation would pin data to IPFS and return URI
  // This is a placeholder
  return `ipfs://Qm${Math.random().toString(36).substring(2)}`;
}

// Contract instances
let optOutRegistryContract: ethers.Contract;
let complianceMonitoringContract: ethers.Contract;
let protectionPoolContract: ethers.Contract;

export async function registerAdtechOptOutRoutes(app: FastifyInstance) {
  // Initialize contracts
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  optOutRegistryContract = new ethers.Contract(
    process.env.ADTECH_OPT_OUT_REGISTRY_CONTRACT!,
    AdtechOptOutRegistryABI,
    wallet
  );
  
  complianceMonitoringContract = new ethers.Contract(
    process.env.COMPLIANCE_MONITORING_CONTRACT!,
    ComplianceMonitoringABI,
    wallet
  );
  
  protectionPoolContract = new ethers.Contract(
    process.env.ADTECH_CONSUMER_PROTECTION_POOL_CONTRACT!,
    AdtechConsumerProtectionPoolABI,
    wallet
  );

  // Register opt-out
  app.post('/optout/register', {
    schema: {
      body: RegisterOptOutSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            consumerId: { type: 'string' },
            optOutId: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { consumerInfo, optOutType, evidence, preferences } = request.body;
      
      // Create privacy-preserving consumer ID
      const consumerId = hashConsumerId(consumerInfo);
      
      // Store evidence on IPFS
      const evidenceUri = await pinToIPFS({
        evidence,
        registeredAt: new Date().toISOString(),
        preferences
      });
      
      // Map opt-out type to enum value
      const optOutTypeMap: Record<string, number> = {
        'nai': 0,
        'daa': 1,
        'gpc': 2,
        'ccpa': 3,
        'gdpr': 4,
        'custom': 5
      };
      
      const optOutTypeValue = optOutTypeMap[optOutType];
      const expiresAt = preferences.expiresAt || 0; // 0 for permanent
      
      // Register opt-out on contract
      const tx = await optOutRegistryContract.registerOptOut(
        consumerId,
        optOutTypeValue,
        evidenceUri,
        expiresAt
      );
      
      const receipt = await tx.wait();
      const optOutId = receipt.events[0].args[0]; // Assuming optOutId is first arg
      
      return {
        consumerId,
        optOutId,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to register opt-out', message: error.message });
    }
  });

  // Report violation
  app.post('/violation/report', {
    schema: {
      body: ReportViolationSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            reportId: { type: 'string' },
            consumerId: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { consumerId, adNetwork, violationType, evidence, severity } = request.body;
      
      // Store evidence on IPFS
      const evidenceUri = await pinToIPFS({
        evidence,
        severity,
        reportedAt: new Date().toISOString()
      });
      
      // Report violation on contract
      const tx = await optOutRegistryContract.reportViolation(
        consumerId,
        adNetwork,
        violationType,
        evidenceUri
      );
      
      const receipt = await tx.wait();
      const reportId = receipt.events[0].args[0]; // Assuming reportId is first arg
      
      return {
        reportId,
        consumerId,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to report violation', message: error.message });
    }
  });

  // Start monitoring session
  app.post('/monitoring/start', {
    schema: {
      body: StartMonitoringSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            consumerId: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { consumerId, adNetwork, monitoringType, duration, rules } = request.body;
      
      // Start monitoring session on contract
      const tx = await complianceMonitoringContract.startMonitoringSession(
        consumerId,
        adNetwork
      );
      
      const receipt = await tx.wait();
      const sessionId = receipt.events[0].args[0]; // Assuming sessionId is first arg
      
      return {
        sessionId,
        consumerId,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to start monitoring', message: error.message });
    }
  });

  // End monitoring session
  app.post('/monitoring/end', {
    schema: {
      body: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
          violationDetected: { type: 'boolean' },
          violationType: { type: 'string' },
          evidenceUri: { type: 'string' }
        },
        required: ['sessionId', 'violationDetected']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { sessionId, violationDetected, violationType, evidenceUri } = request.body;
      
      // End monitoring session on contract
      const tx = await complianceMonitoringContract.endMonitoringSession(
        sessionId,
        violationDetected,
        violationType || '',
        evidenceUri || ''
      );
      
      await tx.wait();
      
      return {
        sessionId,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to end monitoring', message: error.message });
    }
  });

  // Submit consumer claim
  app.post('/claim/submit', {
    schema: {
      body: {
        type: 'object',
        properties: {
          consumerId: { type: 'string' },
          violationType: { type: 'string' },
          claimAmount: { type: 'string' },
          evidenceUri: { type: 'string' }
        },
        required: ['consumerId', 'violationType', 'claimAmount', 'evidenceUri']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            claimId: { type: 'string' },
            consumerId: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { consumerId, violationType, claimAmount, evidenceUri } = request.body;
      
      const claimAmountWei = ethers.utils.parseEther(claimAmount);
      
      // Submit claim on contract
      const tx = await protectionPoolContract.submitClaim(
        consumerId,
        violationType,
        claimAmountWei,
        evidenceUri,
        { value: ethers.utils.parseEther('0.01') } // Processing fee
      );
      
      const receipt = await tx.wait();
      const claimId = receipt.events[0].args[0]; // Assuming claimId is first arg
      
      return {
        claimId,
        consumerId,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to submit claim', message: error.message });
    }
  });

  // Get consumer opt-outs
  app.get('/optout/:consumerId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          consumerId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            consumerId: { type: 'string' },
            optOuts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  optOutType: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'number' },
                  verifiedAt: { type: 'number' },
                  expiresAt: { type: 'number' },
                  evidenceUri: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { consumerId } = request.params;
      
      const optOuts = await optOutRegistryContract.getConsumerOptOuts(consumerId);
      
      // Map opt-out types and statuses to strings
      const optOutTypeMap = ['nai', 'daa', 'gpc', 'ccpa', 'gdpr', 'custom'];
      const statusMap = ['active', 'pending', 'verified', 'violated', 'revoked'];
      
      const formattedOptOuts = optOuts.map((optOut: any) => ({
        optOutType: optOutTypeMap[optOut.optOutType] || 'unknown',
        status: statusMap[optOut.status] || 'unknown',
        createdAt: optOut.createdAt.toNumber(),
        verifiedAt: optOut.verifiedAt.toNumber(),
        expiresAt: optOut.expiresAt.toNumber(),
        evidenceUri: optOut.evidenceUri
      }));
      
      return {
        consumerId,
        optOuts: formattedOptOuts
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get opt-outs', message: error.message });
    }
  });

  // Get ad network information
  app.get('/network/:networkName', {
    schema: {
      params: {
        type: 'object',
        properties: {
          networkName: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            domain: { type: 'string' },
            compliant: { type: 'boolean' },
            violations: { type: 'number' },
            lastViolation: { type: 'number' },
            blacklisted: { type: 'boolean' },
            registeredAt: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { networkName } = request.params;
      
      const network = await optOutRegistryContract.getAdNetwork(networkName);
      
      return {
        name: network.name,
        domain: network.domain,
        compliant: network.compliant,
        violations: network.violations.toNumber(),
        lastViolation: network.lastViolation.toNumber(),
        blacklisted: network.blacklisted,
        registeredAt: network.registeredAt.toNumber()
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get network info', message: error.message });
    }
  });

  // Get compliance score
  app.get('/compliance/:networkName', {
    schema: {
      params: {
        type: 'object',
        properties: {
          networkName: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            adNetwork: { type: 'string' },
            score: { type: 'number' },
            totalChecks: { type: 'number' },
            violations: { type: 'number' },
            lastCheck: { type: 'number' },
            certified: { type: 'boolean' },
            certificationExpiry: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { networkName } = request.params;
      
      const score = await complianceMonitoringContract.getComplianceScore(networkName);
      
      return {
        adNetwork: score.adNetwork,
        score: score.score.toNumber(),
        totalChecks: score.totalChecks.toNumber(),
        violations: score.violations.toNumber(),
        lastCheck: score.lastCheck.toNumber(),
        certified: score.certified,
        certificationExpiry: score.certificationExpiry.toNumber()
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get compliance score', message: error.message });
    }
  });

  // Check opt-out status
  app.get('/optout/:consumerId/status/:optOutType', {
    schema: {
      params: {
        type: 'object',
        properties: {
          consumerId: { type: 'string' },
          optOutType: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            consumerId: { type: 'string' },
            optOutType: { type: 'string' },
            hasActiveOptOut: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { consumerId, optOutType } = request.params;
      
      // Map opt-out type to enum value
      const optOutTypeMap: Record<string, number> = {
        'nai': 0,
        'daa': 1,
        'gpc': 2,
        'ccpa': 3,
        'gdpr': 4,
        'custom': 5
      };
      
      const optOutTypeValue = optOutTypeMap[optOutType];
      const hasActiveOptOut = await optOutRegistryContract.hasActiveOptOut(consumerId, optOutTypeValue);
      
      return {
        consumerId,
        optOutType,
        hasActiveOptOut
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to check opt-out status', message: error.message });
    }
  });

  // Get system statistics
  app.get('/stats', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            optOuts: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                violations: { type: 'number' },
                penalties: { type: 'number' },
                networks: { type: 'number' }
              }
            },
            monitoring: {
              type: 'object',
              properties: {
                totalRules: { type: 'number' },
                totalSessions: { type: 'number' },
                totalViolations: { type: 'number' },
                totalDetections: { type: 'number' }
              }
            },
            protection: {
              type: 'object',
              properties: {
                totalClaims: { type: 'number' },
                totalPenalties: { type: 'number' },
                totalPayouts: { type: 'string' },
                totalDeposits: { type: 'string' },
                poolBalance: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const [totalOptOuts, totalViolations, totalPenalties, totalNetworks] = await optOutRegistryContract.getStats();
      const [totalRules, totalSessions, totalMonitoringViolations, totalDetections] = await complianceMonitoringContract.getStats();
      const [poolBalance, totalClaims, totalProtectionPenalties, totalPayouts, totalDeposits] = await protectionPoolContract.getPoolStats();
      
      return {
        optOuts: {
          total: totalOptOuts.toNumber(),
          violations: totalViolations.toNumber(),
          penalties: totalPenalties.toNumber(),
          networks: totalNetworks.toNumber()
        },
        monitoring: {
          totalRules: totalRules.toNumber(),
          totalSessions: totalSessions.toNumber(),
          totalViolations: totalMonitoringViolations.toNumber(),
          totalDetections: totalDetections.toNumber()
        },
        protection: {
          totalClaims: totalClaims.toNumber(),
          totalPenalties: totalProtectionPenalties.toNumber(),
          totalPayouts: ethers.utils.formatEther(totalPayouts),
          totalDeposits: ethers.utils.formatEther(totalDeposits),
          poolBalance: ethers.utils.formatEther(poolBalance)
        }
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get statistics', message: error.message });
    }
  });

  // Health check
  app.get('/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            timestamp: { type: 'string' },
            version: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      ok: true,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    };
  });
}
