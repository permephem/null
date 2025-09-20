import Fastify, { FastifyInstance } from 'fastify';
import { ethers } from 'ethers';
import { z } from 'zod';

// Types
interface IdentityProfile {
  identityCommit: string;
  biometricCommit: string;
  status: number;
  verifiedAt: number;
  lastActivity: number;
  verifiedBy: string;
  evidenceUri: string;
}

interface FraudAlert {
  alertId: string;
  identityCommit: string;
  fraudType: number;
  description: string;
  detectedAt: number;
  resolvedAt: number;
  resolved: boolean;
  resolutionEvidence: string;
}

interface ProtectionPolicy {
  identityCommit: string;
  creditFreeze: boolean;
  accountMonitoring: boolean;
  biometricVerification: boolean;
  protectionLevel: number;
  expiresAt: number;
}

interface ProtectionPlan {
  identityCommit: string;
  monthlyFee: string;
  protectionLevel: number;
  active: boolean;
  startDate: number;
  lastPayment: number;
  fraudCases: number;
  resolvedCases: number;
  totalPaid: string;
  totalRefunded: string;
}

// Validation schemas
const VerifyIdentitySchema = z.object({
  identityId: z.string().min(1),
  biometricData: z.object({
    fingerprintHash: z.string().optional(),
    faceRecognitionHash: z.string().optional(),
    voicePrintHash: z.string().optional(),
    irisScanHash: z.string().optional()
  }),
  personalInfo: z.object({
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string(),
    ssnLastFour: z.string().length(4),
    address: z.string(),
    phoneNumber: z.string(),
    emailAddress: z.string().email()
  }),
  evidence: z.object({
    governmentId: z.string(),
    utilityBill: z.string(),
    bankStatement: z.string(),
    verificationMethod: z.string()
  })
});

const CreateFraudAlertSchema = z.object({
  identityId: z.string().min(1),
  fraudType: z.enum([
    'account_opening',
    'credit_application',
    'loan_application',
    'tax_fraud',
    'medical_identity',
    'synthetic_identity',
    'account_takeover'
  ]),
  description: z.string().min(1),
  institution: z.string().min(1),
  evidence: z.object({
    suspiciousActivity: z.string(),
    supportingDocuments: z.array(z.string()).optional(),
    reportedBy: z.string()
  })
});

const CreateProtectionPlanSchema = z.object({
  identityId: z.string().min(1),
  protectionLevel: z.number().min(1).max(10),
  monthlyFee: z.string(),
  features: z.object({
    creditFreeze: z.boolean(),
    accountMonitoring: z.boolean(),
    biometricVerification: z.boolean(),
    fraudPrevention: z.boolean(),
    identityRestoration: z.boolean()
  })
});

// Contract interfaces
const IdentityProtectionABI = [
  "function verifyIdentity(bytes32,bytes32,string) external",
  "function createFraudAlert(bytes32,uint8,string) external returns (bytes32)",
  "function resolveFraudAlert(bytes32,string) external",
  "function createProtectionPolicy(bytes32,bool,bool,bool,uint256,uint256) external",
  "function getIdentityProfile(bytes32) external view returns (tuple(bytes32,bytes32,uint8,uint256,uint256,address,string))",
  "function getFraudAlert(bytes32) external view returns (tuple(bytes32,bytes32,uint8,string,uint256,uint256,bool,string))",
  "function getProtectionPolicy(bytes32) external view returns (tuple(bytes32,bool,bool,bool,uint256,uint256))",
  "function isIdentityProtected(bytes32) external view returns (bool)",
  "function getStats() external view returns (uint256,uint256,uint256,uint256)",
  "event IdentityVerified(bytes32,bytes32,uint8,address,uint256)",
  "event FraudAlertCreated(bytes32,bytes32,uint8,string,uint256)",
  "event FraudAlertResolved(bytes32,bytes32,string,uint256)"
];

const FraudPreventionABI = [
  "function detectFraudAttempt(bytes32,uint8,string) external returns (bytes32,bool,uint8)",
  "function createPreventionRule(uint8,string,uint8) external returns (bytes32)",
  "function getFraudAttempt(bytes32) external view returns (tuple(bytes32,bytes32,uint8,string,uint256,bool,string,bytes32))",
  "function getStats() external view returns (uint256,uint256,uint256,uint256)",
  "event FraudAttemptDetected(bytes32,bytes32,uint8,string,uint256)",
  "event FraudAttemptBlocked(bytes32,bytes32,uint8,string,string,bytes32)"
];

const IdentityProtectionPoolABI = [
  "function createProtectionPlan(bytes32,uint256,uint256) external",
  "function processPayment(bytes32) external payable",
  "function reportFraudCase(bytes32,string,string) external returns (bytes32)",
  "function issueResolutionGuarantee(bytes32,bytes32,uint256,uint256) external",
  "function resolveFraudCase(bytes32,string) external",
  "function resolveFraudWithGuarantee(bytes32,bool) external",
  "function getProtectionPlan(bytes32) external view returns (tuple(bytes32,uint256,uint256,bool,uint256,uint256,uint256,uint256,uint256,uint256))",
  "function getFraudCase(bytes32) external view returns (tuple(bytes32,bytes32,string,string,uint256,uint256,bool,string))",
  "function getResolutionGuarantee(bytes32) external view returns (tuple(bytes32,bytes32,uint256,uint256,bool,bool,string,string))",
  "function getPoolStats() external view returns (uint256,uint256,uint256,uint256)",
  "event ProtectionPlanCreated(bytes32,uint256,uint256,uint256)",
  "event FraudCaseReported(bytes32,bytes32,string,string,uint256)",
  "event ResolutionGuaranteeIssued(bytes32,bytes32,uint256,uint256)"
];

// Utility functions
function hashIdentityId(identityId: string): string {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(identityId + process.env.IDENTITY_SALT));
}

function hashBiometricData(biometricData: any): string {
  const biometricString = JSON.stringify(biometricData);
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(biometricString));
}

async function pinToIPFS(data: any): Promise<string> {
  // Implementation would pin data to IPFS and return URI
  // This is a placeholder
  return `ipfs://Qm${Math.random().toString(36).substring(2)}`;
}

// Contract instances
let identityProtectionContract: ethers.Contract;
let fraudPreventionContract: ethers.Contract;
let protectionPoolContract: ethers.Contract;

export async function registerIdentityProtectionRoutes(app: FastifyInstance) {
  // Initialize contracts
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  identityProtectionContract = new ethers.Contract(
    process.env.IDENTITY_PROTECTION_CONTRACT!,
    IdentityProtectionABI,
    wallet
  );
  
  fraudPreventionContract = new ethers.Contract(
    process.env.FRAUD_PREVENTION_CONTRACT!,
    FraudPreventionABI,
    wallet
  );
  
  protectionPoolContract = new ethers.Contract(
    process.env.PROTECTION_POOL_CONTRACT!,
    IdentityProtectionPoolABI,
    wallet
  );

  // Verify identity
  app.post('/identity/verify', {
    schema: {
      body: VerifyIdentitySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            identityCommit: { type: 'string' },
            biometricCommit: { type: 'string' },
            canonTx: { type: 'string' },
            evidenceUri: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { identityId, biometricData, personalInfo, evidence } = request.body;
      
      // Create privacy-preserving commitments
      const identityCommit = hashIdentityId(identityId);
      const biometricCommit = hashBiometricData(biometricData);
      
      // Store evidence on IPFS
      const evidenceUri = await pinToIPFS({
        personalInfo,
        evidence,
        verifiedAt: new Date().toISOString()
      });
      
      // Verify identity on contract
      const tx = await identityProtectionContract.verifyIdentity(
        identityCommit,
        biometricCommit,
        evidenceUri
      );
      
      await tx.wait();
      
      return {
        identityCommit,
        biometricCommit,
        canonTx: tx.hash,
        evidenceUri
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to verify identity', message: error.message });
    }
  });

  // Create fraud alert
  app.post('/fraud/alert', {
    schema: {
      body: CreateFraudAlertSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            alertId: { type: 'string' },
            identityCommit: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { identityId, fraudType, description, institution, evidence } = request.body;
      
      const identityCommit = hashIdentityId(identityId);
      
      // Map fraud type to enum value
      const fraudTypeMap: Record<string, number> = {
        'account_opening': 0,
        'credit_application': 1,
        'loan_application': 2,
        'tax_fraud': 3,
        'medical_identity': 4,
        'synthetic_identity': 5,
        'account_takeover': 6
      };
      
      const fraudTypeValue = fraudTypeMap[fraudType];
      
      // Create fraud alert on contract
      const tx = await identityProtectionContract.createFraudAlert(
        identityCommit,
        fraudTypeValue,
        description
      );
      
      const receipt = await tx.wait();
      const alertId = receipt.events[0].args.alertId;
      
      // Detect fraud attempt for prevention
      await fraudPreventionContract.detectFraudAttempt(
        identityCommit,
        fraudTypeValue,
        institution
      );
      
      return {
        alertId,
        identityCommit,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to create fraud alert', message: error.message });
    }
  });

  // Resolve fraud alert
  app.post('/fraud/resolve', {
    schema: {
      body: {
        type: 'object',
        properties: {
          alertId: { type: 'string' },
          resolutionEvidence: { type: 'string' },
          resolutionDetails: { type: 'object' }
        },
        required: ['alertId', 'resolutionEvidence']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            alertId: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { alertId, resolutionEvidence, resolutionDetails } = request.body;
      
      // Resolve fraud alert on contract
      const tx = await identityProtectionContract.resolveFraudAlert(
        alertId,
        resolutionEvidence
      );
      
      await tx.wait();
      
      return {
        alertId,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to resolve fraud alert', message: error.message });
    }
  });

  // Create protection plan
  app.post('/protection/plan', {
    schema: {
      body: CreateProtectionPlanSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            identityCommit: { type: 'string' },
            protectionLevel: { type: 'number' },
            monthlyFee: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { identityId, protectionLevel, monthlyFee, features } = request.body;
      
      const identityCommit = hashIdentityId(identityId);
      const monthlyFeeWei = ethers.utils.parseEther(monthlyFee);
      
      // Create protection plan on contract
      const tx = await protectionPoolContract.createProtectionPlan(
        identityCommit,
        monthlyFeeWei,
        protectionLevel
      );
      
      await tx.wait();
      
      // Create protection policy
      const expiresAt = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year
      await identityProtectionContract.createProtectionPolicy(
        identityCommit,
        features.creditFreeze,
        features.accountMonitoring,
        features.biometricVerification,
        protectionLevel,
        expiresAt
      );
      
      return {
        identityCommit,
        protectionLevel,
        monthlyFee,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to create protection plan', message: error.message });
    }
  });

  // Process protection payment
  app.post('/protection/:identityId/payment', {
    schema: {
      params: {
        type: 'object',
        properties: {
          identityId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          amount: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            identityCommit: { type: 'string' },
            amount: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { identityId } = request.params;
      const { amount } = request.body;
      
      const identityCommit = hashIdentityId(identityId);
      const amountWei = ethers.utils.parseEther(amount);
      
      // Process payment on contract
      const tx = await protectionPoolContract.processPayment(identityCommit, {
        value: amountWei
      });
      
      await tx.wait();
      
      return {
        identityCommit,
        amount,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to process payment', message: error.message });
    }
  });

  // Report fraud case
  app.post('/fraud/case', {
    schema: {
      body: {
        type: 'object',
        properties: {
          identityId: { type: 'string' },
          fraudType: { type: 'string' },
          description: { type: 'string' },
          evidence: { type: 'object' }
        },
        required: ['identityId', 'fraudType', 'description']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            caseId: { type: 'string' },
            identityCommit: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { identityId, fraudType, description, evidence } = request.body;
      
      const identityCommit = hashIdentityId(identityId);
      
      // Report fraud case on contract
      const tx = await protectionPoolContract.reportFraudCase(
        identityCommit,
        fraudType,
        description
      );
      
      const receipt = await tx.wait();
      const caseId = receipt.events[0].args.caseId;
      
      return {
        caseId,
        identityCommit,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to report fraud case', message: error.message });
    }
  });

  // Issue resolution guarantee
  app.post('/guarantee/issue', {
    schema: {
      body: {
        type: 'object',
        properties: {
          caseId: { type: 'string' },
          identityId: { type: 'string' },
          guaranteeAmount: { type: 'string' },
          resolutionDeadline: { type: 'number' }
        },
        required: ['caseId', 'identityId', 'guaranteeAmount', 'resolutionDeadline']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            caseId: { type: 'string' },
            guaranteeAmount: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { caseId, identityId, guaranteeAmount, resolutionDeadline } = request.body;
      
      const identityCommit = hashIdentityId(identityId);
      const guaranteeAmountWei = ethers.utils.parseEther(guaranteeAmount);
      
      // Issue resolution guarantee on contract
      const tx = await protectionPoolContract.issueResolutionGuarantee(
        caseId,
        identityCommit,
        guaranteeAmountWei,
        resolutionDeadline
      );
      
      await tx.wait();
      
      return {
        caseId,
        guaranteeAmount,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to issue guarantee', message: error.message });
    }
  });

  // Get identity profile
  app.get('/identity/:identityId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          identityId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            identityCommit: { type: 'string' },
            status: { type: 'string' },
            verifiedAt: { type: 'number' },
            lastActivity: { type: 'number' },
            isProtected: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { identityId } = request.params;
      
      const identityCommit = hashIdentityId(identityId);
      const profile = await identityProtectionContract.getIdentityProfile(identityCommit);
      const isProtected = await identityProtectionContract.isIdentityProtected(identityCommit);
      
      // Map status enum to string
      const statusMap = [
        'verified',
        'compromised',
        'under_investigation',
        'restored',
        'permanently_protected'
      ];
      
      return {
        identityCommit,
        status: statusMap[profile.status],
        verifiedAt: profile.verifiedAt.toNumber(),
        lastActivity: profile.lastActivity.toNumber(),
        isProtected
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get identity profile', message: error.message });
    }
  });

  // Get protection plan
  app.get('/protection/:identityId/plan', {
    schema: {
      params: {
        type: 'object',
        properties: {
          identityId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            identityCommit: { type: 'string' },
            monthlyFee: { type: 'string' },
            protectionLevel: { type: 'number' },
            active: { type: 'boolean' },
            startDate: { type: 'number' },
            lastPayment: { type: 'number' },
            fraudCases: { type: 'number' },
            resolvedCases: { type: 'number' },
            totalPaid: { type: 'string' },
            totalRefunded: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { identityId } = request.params;
      
      const identityCommit = hashIdentityId(identityId);
      const plan = await protectionPoolContract.getProtectionPlan(identityCommit);
      
      return {
        identityCommit,
        monthlyFee: ethers.utils.formatEther(plan.monthlyFee),
        protectionLevel: plan.protectionLevel.toNumber(),
        active: plan.active,
        startDate: plan.startDate.toNumber(),
        lastPayment: plan.lastPayment.toNumber(),
        fraudCases: plan.fraudCases.toNumber(),
        resolvedCases: plan.resolvedCases.toNumber(),
        totalPaid: ethers.utils.formatEther(plan.totalPaid),
        totalRefunded: ethers.utils.formatEther(plan.totalRefunded)
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get protection plan', message: error.message });
    }
  });

  // Get system statistics
  app.get('/stats', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            identities: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                verified: { type: 'number' },
                compromised: { type: 'number' },
                protected: { type: 'number' }
              }
            },
            fraud: {
              type: 'object',
              properties: {
                totalAlerts: { type: 'number' },
                resolvedAlerts: { type: 'number' },
                totalCases: { type: 'number' },
                resolvedCases: { type: 'number' }
              }
            },
            protection: {
              type: 'object',
              properties: {
                totalPlans: { type: 'number' },
                activePlans: { type: 'number' },
                totalGuarantees: { type: 'string' },
                poolBalance: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const [totalIdentities, totalAlerts, resolvedAlerts, totalPolicies] = await identityProtectionContract.getStats();
      const [totalRules, totalAttempts, blockedAttempts, totalVerifications] = await fraudPreventionContract.getStats();
      const [poolBalance, totalGuarantees, totalResolutions, totalPlans] = await protectionPoolContract.getPoolStats();
      
      return {
        identities: {
          total: totalIdentities.toNumber(),
          verified: totalIdentities.toNumber(), // This would need additional tracking
          compromised: totalAlerts.toNumber(),
          protected: totalPolicies.toNumber()
        },
        fraud: {
          totalAlerts: totalAlerts.toNumber(),
          resolvedAlerts: resolvedAlerts.toNumber(),
          totalCases: totalResolutions.toNumber(),
          resolvedCases: totalResolutions.toNumber()
        },
        protection: {
          totalPlans: totalPlans.toNumber(),
          activePlans: totalPlans.toNumber(),
          totalGuarantees: ethers.utils.formatEther(totalGuarantees),
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
