import Fastify, { FastifyInstance } from 'fastify';
import { ethers } from 'ethers';
import { z } from 'zod';

// Types
interface DigitalEstate {
  estateId: string;
  deceasedCommit: string;
  executorCommit: string;
  status: number;
  createdAt: number;
  deathDate: number;
  completedAt: number;
  deathCertificateUri: string;
  willUri: string;
  executor: string;
}

interface DigitalAccount {
  accountId: string;
  estateId: string;
  accountType: number;
  serviceProvider: string;
  accountIdentifier: string;
  requiresClosure: boolean;
  closed: boolean;
  closedAt: number;
  closureEvidence: string;
  notes: string;
}

interface VerificationRequest {
  requestId: string;
  accountId: string;
  serviceProvider: string;
  verificationMethod: string;
  requestedAt: number;
  expiresAt: number;
  status: number;
  evidenceUri: string;
  verifier: string;
}

// Validation schemas
const CreateEstateSchema = z.object({
  deceasedInfo: z.object({
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string(),
    deathDate: z.string(),
    ssnLastFour: z.string().length(4),
    address: z.string(),
    phoneNumber: z.string(),
    emailAddress: z.string().email()
  }),
  executorInfo: z.object({
    firstName: z.string(),
    lastName: z.string(),
    relationship: z.string(),
    phoneNumber: z.string(),
    emailAddress: z.string().email(),
    address: z.string()
  }),
  documents: z.object({
    deathCertificate: z.string(),
    will: z.string().optional(),
    trust: z.string().optional(),
    powerOfAttorney: z.string().optional()
  })
});

const AddAccountSchema = z.object({
  estateId: z.string(),
  accountType: z.enum([
    'banking',
    'credit_card',
    'investment',
    'social_media',
    'email',
    'subscription',
    'utility',
    'insurance',
    'government',
    'other'
  ]),
  serviceProvider: z.string(),
  accountIdentifier: z.string(),
  requiresClosure: z.boolean(),
  notes: z.string().optional()
});

const RequestVerificationSchema = z.object({
  accountId: z.string(),
  serviceProvider: z.string(),
  verificationMethod: z.string(),
  expiresAt: z.number()
});

// Contract interfaces
const DigitalEstateManagerABI = [
  "function createDigitalEstate(bytes32,bytes32,uint256,string,string) external returns (bytes32)",
  "function addDigitalAccount(bytes32,uint8,string,string,bool,string) external returns (bytes32)",
  "function closeAccount(bytes32,uint256,string) external",
  "function certifyClosure(bytes32,string,string,bool) external returns (bytes32)",
  "function updateEstateStatus(bytes32,uint8) external",
  "function getDigitalEstate(bytes32) external view returns (tuple(bytes32,bytes32,bytes32,uint8,uint256,uint256,uint256,string,string,address))",
  "function getEstateAccounts(bytes32) external view returns (tuple(bytes32,bytes32,uint8,string,string,bool,bool,uint256,string,string)[])",
  "function getClosureCertification(bytes32) external view returns (tuple(bytes32,bytes32,bytes32,string,string,uint256,address,bool))",
  "function getStats() external view returns (uint256,uint256,uint256,uint256)",
  "event DigitalEstateCreated(bytes32,bytes32,bytes32,uint256,string)",
  "event DigitalAccountAdded(bytes32,bytes32,uint8,string,string)",
  "event AccountClosed(bytes32,bytes32,string,uint256)",
  "event ClosureCertified(bytes32,bytes32,bytes32,string,string,bool)"
];

const AccountClosureVerificationABI = [
  "function requestVerification(bytes32,string,string,uint256) external returns (bytes32)",
  "function completeVerification(bytes32,bool,string,string,string) external",
  "function disputeVerification(bytes32,string,string) external",
  "function registerServiceProvider(string,string,bool,bool,uint256) external",
  "function getVerificationRequest(bytes32) external view returns (tuple(bytes32,bytes32,string,string,uint256,uint256,uint8,string,address))",
  "function getVerificationResult(bytes32) external view returns (tuple(bytes32,bool,string,string,uint256,string))",
  "function getServiceProvider(string) external view returns (tuple(string,string,bool,bool,uint256,bool))",
  "function getStats() external view returns (uint256,uint256,uint256,uint256)",
  "event VerificationRequested(bytes32,bytes32,string,string,uint256)",
  "event VerificationCompleted(bytes32,bytes32,uint8,string,string,string)"
];

const EstateExecutionPoolABI = [
  "function registerExecutor(bytes32,string) external",
  "function startEstateExecution(bytes32,bytes32,uint256,uint256) external payable",
  "function updateExecutionProgress(bytes32,uint256,uint256) external",
  "function completeEstateExecution(bytes32,uint256,uint256,uint256) external",
  "function claimCompensation(bytes32,bytes32,uint256,string,string) external returns (bytes32)",
  "function processCompensationClaim(bytes32,bool) external",
  "function getEstateExecution(bytes32) external view returns (tuple(bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,bool,uint256,uint256))",
  "function getExecutorProfile(bytes32) external view returns (tuple(bytes32,uint256,uint256,uint256,uint256,bool,string,uint256))",
  "function getCompensationClaim(bytes32) external view returns (tuple(bytes32,bytes32,bytes32,uint256,string,uint256,bool,bool,string))",
  "function getPerformanceMetrics(bytes32) external view returns (tuple(bytes32,uint256,uint256,uint256,uint256,uint256,uint256))",
  "function getPoolStats() external view returns (uint256,uint256,uint256,uint256)",
  "event EstateExecutionStarted(bytes32,bytes32,uint256,uint256,uint256)",
  "event EstateExecutionCompleted(bytes32,bytes32,uint256,uint256,uint256,uint256)",
  "event ExecutorRegistered(bytes32,string,uint256)",
  "event CompensationClaimed(bytes32,bytes32,bytes32,uint256,string)"
];

// Utility functions
function hashDeceasedId(deceasedInfo: any): string {
  const deceasedString = JSON.stringify(deceasedInfo);
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(deceasedString + process.env.ESTATE_SALT));
}

function hashExecutorId(executorInfo: any): string {
  const executorString = JSON.stringify(executorInfo);
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(executorString + process.env.ESTATE_SALT));
}

async function pinToIPFS(data: any): Promise<string> {
  // Implementation would pin data to IPFS and return URI
  // This is a placeholder
  return `ipfs://Qm${Math.random().toString(36).substring(2)}`;
}

// Contract instances
let estateManagerContract: ethers.Contract;
let verificationContract: ethers.Contract;
let executionPoolContract: ethers.Contract;

export async function registerDigitalEstateRoutes(app: FastifyInstance) {
  // Initialize contracts
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  estateManagerContract = new ethers.Contract(
    process.env.ESTATE_MANAGER_CONTRACT!,
    DigitalEstateManagerABI,
    wallet
  );
  
  verificationContract = new ethers.Contract(
    process.env.VERIFICATION_CONTRACT!,
    AccountClosureVerificationABI,
    wallet
  );
  
  executionPoolContract = new ethers.Contract(
    process.env.EXECUTION_POOL_CONTRACT!,
    EstateExecutionPoolABI,
    wallet
  );

  // Create digital estate
  app.post('/estate/create', {
    schema: {
      body: CreateEstateSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            estateId: { type: 'string' },
            deceasedCommit: { type: 'string' },
            executorCommit: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { deceasedInfo, executorInfo, documents } = request.body;
      
      // Create privacy-preserving commitments
      const deceasedCommit = hashDeceasedId(deceasedInfo);
      const executorCommit = hashExecutorId(executorInfo);
      
      // Store documents on IPFS
      const deathCertificateUri = await pinToIPFS({
        document: documents.deathCertificate,
        type: 'death_certificate',
        uploadedAt: new Date().toISOString()
      });
      
      const willUri = documents.will ? await pinToIPFS({
        document: documents.will,
        type: 'will',
        uploadedAt: new Date().toISOString()
      }) : '';
      
      // Convert death date to timestamp
      const deathDate = Math.floor(new Date(deceasedInfo.deathDate).getTime() / 1000);
      
      // Create digital estate on contract
      const tx = await estateManagerContract.createDigitalEstate(
        deceasedCommit,
        executorCommit,
        deathDate,
        deathCertificateUri,
        willUri
      );
      
      const receipt = await tx.wait();
      const estateId = receipt.events[0].args.estateId;
      
      return {
        estateId,
        deceasedCommit,
        executorCommit,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to create estate', message: error.message });
    }
  });

  // Add digital account
  app.post('/estate/account/add', {
    schema: {
      body: AddAccountSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            accountId: { type: 'string' },
            estateId: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { estateId, accountType, serviceProvider, accountIdentifier, requiresClosure, notes } = request.body;
      
      // Map account type to enum value
      const accountTypeMap: Record<string, number> = {
        'banking': 0,
        'credit_card': 1,
        'investment': 2,
        'social_media': 3,
        'email': 4,
        'subscription': 5,
        'utility': 6,
        'insurance': 7,
        'government': 8,
        'other': 9
      };
      
      const accountTypeValue = accountTypeMap[accountType];
      
      // Add digital account on contract
      const tx = await estateManagerContract.addDigitalAccount(
        estateId,
        accountTypeValue,
        serviceProvider,
        accountIdentifier,
        requiresClosure,
        notes || ''
      );
      
      const receipt = await tx.wait();
      const accountId = receipt.events[0].args.accountId;
      
      return {
        accountId,
        estateId,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to add account', message: error.message });
    }
  });

  // Close account
  app.post('/estate/account/close', {
    schema: {
      body: {
        type: 'object',
        properties: {
          estateId: { type: 'string' },
          accountIndex: { type: 'number' },
          closureEvidence: { type: 'string' }
        },
        required: ['estateId', 'accountIndex', 'closureEvidence']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            estateId: { type: 'string' },
            accountIndex: { type: 'number' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { estateId, accountIndex, closureEvidence } = request.body;
      
      // Close account on contract
      const tx = await estateManagerContract.closeAccount(
        estateId,
        accountIndex,
        closureEvidence
      );
      
      await tx.wait();
      
      return {
        estateId,
        accountIndex,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to close account', message: error.message });
    }
  });

  // Request verification
  app.post('/verification/request', {
    schema: {
      body: RequestVerificationSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            requestId: { type: 'string' },
            accountId: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { accountId, serviceProvider, verificationMethod, expiresAt } = request.body;
      
      // Request verification on contract
      const tx = await verificationContract.requestVerification(
        accountId,
        serviceProvider,
        verificationMethod,
        expiresAt
      );
      
      const receipt = await tx.wait();
      const requestId = receipt.events[0].args.requestId;
      
      return {
        requestId,
        accountId,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to request verification', message: error.message });
    }
  });

  // Complete verification
  app.post('/verification/complete', {
    schema: {
      body: {
        type: 'object',
        properties: {
          requestId: { type: 'string' },
          successful: { type: 'boolean' },
          resultCode: { type: 'string' },
          resultMessage: { type: 'string' },
          evidenceUri: { type: 'string' }
        },
        required: ['requestId', 'successful', 'resultCode', 'resultMessage', 'evidenceUri']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            requestId: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { requestId, successful, resultCode, resultMessage, evidenceUri } = request.body;
      
      // Complete verification on contract
      const tx = await verificationContract.completeVerification(
        requestId,
        successful,
        resultCode,
        resultMessage,
        evidenceUri
      );
      
      await tx.wait();
      
      return {
        requestId,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to complete verification', message: error.message });
    }
  });

  // Register executor
  app.post('/executor/register', {
    schema: {
      body: {
        type: 'object',
        properties: {
          executorInfo: {
            type: 'object',
            properties: {
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              credentials: { type: 'string' },
              experience: { type: 'string' },
              certifications: { type: 'array', items: { type: 'string' } }
            },
            required: ['firstName', 'lastName', 'credentials']
          }
        },
        required: ['executorInfo']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            executorCommit: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { executorInfo } = request.body;
      
      const executorCommit = hashExecutorId(executorInfo);
      
      // Store credentials on IPFS
      const credentialsUri = await pinToIPFS({
        credentials: executorInfo.credentials,
        experience: executorInfo.experience,
        certifications: executorInfo.certifications,
        registeredAt: new Date().toISOString()
      });
      
      // Register executor on contract
      const tx = await executionPoolContract.registerExecutor(
        executorCommit,
        credentialsUri
      );
      
      await tx.wait();
      
      return {
        executorCommit,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to register executor', message: error.message });
    }
  });

  // Start estate execution
  app.post('/execution/start', {
    schema: {
      body: {
        type: 'object',
        properties: {
          estateId: { type: 'string' },
          executorCommit: { type: 'string' },
          totalAccounts: { type: 'number' },
          executionFee: { type: 'string' }
        },
        required: ['estateId', 'executorCommit', 'totalAccounts', 'executionFee']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            estateId: { type: 'string' },
            executorCommit: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { estateId, executorCommit, totalAccounts, executionFee } = request.body;
      
      const executionFeeWei = ethers.utils.parseEther(executionFee);
      
      // Start estate execution on contract
      const tx = await executionPoolContract.startEstateExecution(
        estateId,
        executorCommit,
        totalAccounts,
        executionFeeWei,
        { value: executionFeeWei }
      );
      
      await tx.wait();
      
      return {
        estateId,
        executorCommit,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to start execution', message: error.message });
    }
  });

  // Get estate information
  app.get('/estate/:estateId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          estateId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            estateId: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'number' },
            deathDate: { type: 'number' },
            completedAt: { type: 'number' },
            totalAccounts: { type: 'number' },
            closedAccounts: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { estateId } = request.params;
      
      const estate = await estateManagerContract.getDigitalEstate(estateId);
      const accounts = await estateManagerContract.getEstateAccounts(estateId);
      
      // Map status enum to string
      const statusMap = [
        'active',
        'executing',
        'completed',
        'disputed',
        'permanently_closed'
      ];
      
      const closedAccounts = accounts.filter((account: any) => account.closed).length;
      
      return {
        estateId,
        status: statusMap[estate.status],
        createdAt: estate.createdAt.toNumber(),
        deathDate: estate.deathDate.toNumber(),
        completedAt: estate.completedAt.toNumber(),
        totalAccounts: accounts.length,
        closedAccounts
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get estate', message: error.message });
    }
  });

  // Get executor profile
  app.get('/executor/:executorCommit', {
    schema: {
      params: {
        type: 'object',
        properties: {
          executorCommit: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            executorCommit: { type: 'string' },
            totalEstates: { type: 'number' },
            successfulEstates: { type: 'number' },
            totalEarnings: { type: 'string' },
            rating: { type: 'number' },
            active: { type: 'boolean' },
            joinedAt: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { executorCommit } = request.params;
      
      const profile = await executionPoolContract.getExecutorProfile(executorCommit);
      const metrics = await executionPoolContract.getPerformanceMetrics(executorCommit);
      
      return {
        executorCommit,
        totalEstates: profile.totalEstates.toNumber(),
        successfulEstates: profile.successfulEstates.toNumber(),
        totalEarnings: ethers.utils.formatEther(profile.totalEarnings),
        rating: profile.rating.toNumber(),
        active: profile.active,
        joinedAt: profile.joinedAt.toNumber()
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get executor profile', message: error.message });
    }
  });

  // Get system statistics
  app.get('/stats', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            estates: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                totalAccounts: { type: 'number' },
                closedAccounts: { type: 'number' },
                certifications: { type: 'number' }
              }
            },
            verification: {
              type: 'object',
              properties: {
                totalRequests: { type: 'number' },
                verified: { type: 'number' },
                failed: { type: 'number' },
                disputed: { type: 'number' }
              }
            },
            execution: {
              type: 'object',
              properties: {
                totalExecutions: { type: 'number' },
                totalCompensations: { type: 'string' },
                totalExecutors: { type: 'number' },
                poolBalance: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const [totalEstates, totalAccounts, totalClosedAccounts, totalCertifications] = await estateManagerContract.getStats();
      const [totalRequests, totalVerified, totalFailed, totalDisputed] = await verificationContract.getStats();
      const [poolBalance, totalExecutions, totalCompensations, totalExecutors] = await executionPoolContract.getPoolStats();
      
      return {
        estates: {
          total: totalEstates.toNumber(),
          totalAccounts: totalAccounts.toNumber(),
          closedAccounts: totalClosedAccounts.toNumber(),
          certifications: totalCertifications.toNumber()
        },
        verification: {
          totalRequests: totalRequests.toNumber(),
          verified: totalVerified.toNumber(),
          failed: totalFailed.toNumber(),
          disputed: totalDisputed.toNumber()
        },
        execution: {
          totalExecutions: totalExecutions.toNumber(),
          totalCompensations: ethers.utils.formatEther(totalCompensations),
          totalExecutors: totalExecutors.toNumber(),
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
