import Fastify, { FastifyInstance } from 'fastify';
import { ethers } from 'ethers';
import { z } from 'zod';

// Types
interface DisputeWarrant {
  disputeId: string;
  consumerCommit: string;
  accountCommit: string;
  disputeType: number;
  evidenceUri: string;
  submittedAt: number;
  resolvedAt: number;
  status: number;
  creditBureau: string;
  resolutionReason: string;
}

interface DeletionAttestation {
  disputeId: string;
  consumerCommit: string;
  accountCommit: string;
  deletionReason: string;
  deletedAt: number;
  attestedBy: string;
  evidenceUri: string;
  permanent: boolean;
}

interface Subscription {
  consumerCommit: string;
  monthlyFee: string;
  startDate: number;
  lastPayment: number;
  active: boolean;
  disputesSubmitted: number;
  disputesResolved: number;
  totalPaid: string;
  totalRefunded: string;
}

// Validation schemas
const SubmitDisputeSchema = z.object({
  consumerId: z.string().min(1),
  accountInfo: z.object({
    accountNumber: z.string().optional(),
    creditorName: z.string(),
    accountType: z.string(),
    originalAmount: z.string().optional(),
    currentBalance: z.string().optional(),
    dateOpened: z.string().optional(),
    dateReported: z.string().optional(),
    lastPaymentDate: z.string().optional()
  }),
  disputeType: z.enum([
    'inaccurate_info',
    'identity_theft',
    'outdated_info',
    'duplicate_entry',
    'paid_debt',
    'bankruptcy_discharge',
    'statute_limitation'
  ]),
  evidence: z.object({
    supportingDocuments: z.array(z.string()).optional(),
    explanation: z.string(),
    consumerSignature: z.string(),
    dateSigned: z.string()
  })
});

const ResolveDisputeSchema = z.object({
  disputeId: z.string(),
  status: z.enum(['resolved', 'denied', 'permanently_deleted']),
  resolutionReason: z.string(),
  evidence: z.object({
    investigationResults: z.string(),
    supportingDocuments: z.array(z.string()).optional(),
    creditBureauSignature: z.string()
  })
});

const CreateSubscriptionSchema = z.object({
  consumerId: z.string().min(1),
  monthlyFee: z.string(),
  paymentMethod: z.string()
});

// Contract interfaces
const CreditDisputeWarrantABI = [
  "function submitDisputeWarrant(bytes32,bytes32,uint8,string) external returns (bytes32)",
  "function resolveDispute(bytes32,uint8,string) external",
  "function attestPermanentDeletion(bytes32,bytes32,bytes32,string,string) external",
  "function getDispute(bytes32) external view returns (tuple(bytes32,bytes32,bytes32,uint8,string,uint256,uint256,uint8,address,string))",
  "function isPermanentlyDeleted(bytes32) external view returns (bool)",
  "function getStats() external view returns (uint256,uint256,uint256)",
  "event DisputeSubmitted(bytes32,bytes32,bytes32,uint8,string,uint256)",
  "event DisputeResolved(bytes32,uint8,string,uint256)",
  "event CreditItemDeleted(bytes32,bytes32,bytes32,string,uint256,address)"
];

const CreditRepairProtectionPoolABI = [
  "function createSubscription(bytes32,uint256) external",
  "function processPayment(bytes32) external payable",
  "function submitDispute(bytes32,bytes32) external",
  "function resolveDispute(bytes32,bytes32) external",
  "function requestRefund(bytes32,bytes32,string) external",
  "function processRefund(bytes32) external",
  "function cancelSubscription(bytes32) external",
  "function getSubscription(bytes32) external view returns (tuple(bytes32,uint256,uint256,uint256,bool,uint256,uint256,uint256,uint256))",
  "function calculateRefund(bytes32) external view returns (uint256)",
  "function getPoolStats() external view returns (uint256,uint256,uint256)",
  "event SubscriptionCreated(bytes32,uint256,uint256)",
  "event PaymentReceived(bytes32,uint256,uint256)",
  "event RefundRequested(bytes32,bytes32,uint256,string)",
  "event RefundProcessed(bytes32,bytes32,uint256,string)"
];

// Utility functions
function hashConsumerId(consumerId: string): string {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(consumerId + process.env.CONSUMER_SALT));
}

function hashAccountInfo(accountInfo: any): string {
  const accountString = JSON.stringify(accountInfo);
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(accountString));
}

async function pinToIPFS(data: any): Promise<string> {
  // Implementation would pin data to IPFS and return URI
  // This is a placeholder
  return `ipfs://Qm${Math.random().toString(36).substring(2)}`;
}

// Contract instances
let disputeContract: ethers.Contract;
let protectionPoolContract: ethers.Contract;

export async function registerCreditRepairRoutes(app: FastifyInstance) {
  // Initialize contracts
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  disputeContract = new ethers.Contract(
    process.env.CREDIT_DISPUTE_CONTRACT!,
    CreditDisputeWarrantABI,
    wallet
  );
  
  protectionPoolContract = new ethers.Contract(
    process.env.PROTECTION_POOL_CONTRACT!,
    CreditRepairProtectionPoolABI,
    wallet
  );

  // Submit dispute warrant
  app.post('/disputes/submit', {
    schema: {
      body: SubmitDisputeSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            disputeId: { type: 'string' },
            consumerCommit: { type: 'string' },
            accountCommit: { type: 'string' },
            canonTx: { type: 'string' },
            evidenceUri: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { consumerId, accountInfo, disputeType, evidence } = request.body;
      
      // Create privacy-preserving commitments
      const consumerCommit = hashConsumerId(consumerId);
      const accountCommit = hashAccountInfo(accountInfo);
      
      // Map dispute type to enum value
      const disputeTypeMap: Record<string, number> = {
        'inaccurate_info': 0,
        'identity_theft': 1,
        'outdated_info': 2,
        'duplicate_entry': 3,
        'paid_debt': 4,
        'bankruptcy_discharge': 5,
        'statute_limitation': 6
      };
      
      const disputeTypeValue = disputeTypeMap[disputeType];
      
      // Store evidence on IPFS
      const evidenceUri = await pinToIPFS(evidence);
      
      // Submit dispute warrant to contract
      const tx = await disputeContract.submitDisputeWarrant(
        consumerCommit,
        accountCommit,
        disputeTypeValue,
        evidenceUri
      );
      
      const receipt = await tx.wait();
      const disputeId = receipt.events[0].args.disputeId;
      
      // Update subscription dispute count
      await protectionPoolContract.submitDispute(consumerCommit, disputeId);
      
      return {
        disputeId,
        consumerCommit,
        accountCommit,
        canonTx: tx.hash,
        evidenceUri
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to submit dispute', message: error.message });
    }
  });

  // Resolve dispute
  app.post('/disputes/resolve', {
    schema: {
      body: ResolveDisputeSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            disputeId: { type: 'string' },
            status: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { disputeId, status, resolutionReason, evidence } = request.body;
      
      // Map status to enum value
      const statusMap: Record<string, number> = {
        'resolved': 2,
        'denied': 3,
        'permanently_deleted': 4
      };
      
      const statusValue = statusMap[status];
      
      // Resolve dispute on contract
      const tx = await disputeContract.resolveDispute(
        disputeId,
        statusValue,
        resolutionReason
      );
      
      await tx.wait();
      
      // If permanently deleted, create deletion attestation
      if (status === 'permanently_deleted') {
        const dispute = await disputeContract.getDispute(disputeId);
        const evidenceUri = await pinToIPFS(evidence);
        
        await disputeContract.attestPermanentDeletion(
          disputeId,
          dispute.consumerCommit,
          dispute.accountCommit,
          resolutionReason,
          evidenceUri
        );
      }
      
      // Update subscription dispute resolution count
      const dispute = await disputeContract.getDispute(disputeId);
      await protectionPoolContract.resolveDispute(dispute.consumerCommit, disputeId);
      
      return {
        disputeId,
        status,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to resolve dispute', message: error.message });
    }
  });

  // Get dispute status
  app.get('/disputes/:disputeId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          disputeId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            disputeId: { type: 'string' },
            status: { type: 'string' },
            disputeType: { type: 'string' },
            submittedAt: { type: 'number' },
            resolvedAt: { type: 'number' },
            resolutionReason: { type: 'string' },
            isPermanentlyDeleted: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { disputeId } = request.params;
      
      const dispute = await disputeContract.getDispute(disputeId);
      const isPermanentlyDeleted = await disputeContract.isPermanentlyDeleted(disputeId);
      
      // Map enum values to strings
      const disputeTypeMap = [
        'inaccurate_info',
        'identity_theft',
        'outdated_info',
        'duplicate_entry',
        'paid_debt',
        'bankruptcy_discharge',
        'statute_limitation'
      ];
      
      const statusMap = [
        'pending',
        'investigating',
        'resolved',
        'denied',
        'permanently_deleted'
      ];
      
      return {
        disputeId,
        status: statusMap[dispute.status],
        disputeType: disputeTypeMap[dispute.disputeType],
        submittedAt: dispute.submittedAt.toNumber(),
        resolvedAt: dispute.resolvedAt.toNumber(),
        resolutionReason: dispute.resolutionReason,
        isPermanentlyDeleted
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get dispute', message: error.message });
    }
  });

  // Create subscription
  app.post('/subscriptions/create', {
    schema: {
      body: CreateSubscriptionSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            consumerCommit: { type: 'string' },
            monthlyFee: { type: 'string' },
            startDate: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { consumerId, monthlyFee, paymentMethod } = request.body;
      
      const consumerCommit = hashConsumerId(consumerId);
      const monthlyFeeWei = ethers.utils.parseEther(monthlyFee);
      
      // Create subscription on contract
      const tx = await protectionPoolContract.createSubscription(
        consumerCommit,
        monthlyFeeWei
      );
      
      await tx.wait();
      
      return {
        consumerCommit,
        monthlyFee,
        startDate: Date.now()
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to create subscription', message: error.message });
    }
  });

  // Process subscription payment
  app.post('/subscriptions/:consumerId/payment', {
    schema: {
      params: {
        type: 'object',
        properties: {
          consumerId: { type: 'string' }
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
            consumerCommit: { type: 'string' },
            amount: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { consumerId } = request.params;
      const { amount } = request.body;
      
      const consumerCommit = hashConsumerId(consumerId);
      const amountWei = ethers.utils.parseEther(amount);
      
      // Process payment on contract
      const tx = await protectionPoolContract.processPayment(consumerCommit, {
        value: amountWei
      });
      
      await tx.wait();
      
      return {
        consumerCommit,
        amount,
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to process payment', message: error.message });
    }
  });

  // Request refund
  app.post('/subscriptions/:consumerId/refund', {
    schema: {
      params: {
        type: 'object',
        properties: {
          consumerId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          disputeId: { type: 'string' },
          reason: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            consumerCommit: { type: 'string' },
            disputeId: { type: 'string' },
            refundAmount: { type: 'string' },
            canonTx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { consumerId } = request.params;
      const { disputeId, reason } = request.body;
      
      const consumerCommit = hashConsumerId(consumerId);
      
      // Request refund on contract
      const tx = await protectionPoolContract.requestRefund(
        consumerCommit,
        disputeId,
        reason
      );
      
      await tx.wait();
      
      // Calculate refund amount
      const refundAmount = await protectionPoolContract.calculateRefund(consumerCommit);
      
      return {
        consumerCommit,
        disputeId,
        refundAmount: ethers.utils.formatEther(refundAmount),
        canonTx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to request refund', message: error.message });
    }
  });

  // Get subscription status
  app.get('/subscriptions/:consumerId', {
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
            consumerCommit: { type: 'string' },
            monthlyFee: { type: 'string' },
            startDate: { type: 'number' },
            lastPayment: { type: 'number' },
            active: { type: 'boolean' },
            disputesSubmitted: { type: 'number' },
            disputesResolved: { type: 'number' },
            totalPaid: { type: 'string' },
            totalRefunded: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { consumerId } = request.params;
      
      const consumerCommit = hashConsumerId(consumerId);
      const subscription = await protectionPoolContract.getSubscription(consumerCommit);
      
      return {
        consumerCommit,
        monthlyFee: ethers.utils.formatEther(subscription.monthlyFee),
        startDate: subscription.startDate.toNumber(),
        lastPayment: subscription.lastPayment.toNumber(),
        active: subscription.active,
        disputesSubmitted: subscription.disputesSubmitted.toNumber(),
        disputesResolved: subscription.disputesResolved.toNumber(),
        totalPaid: ethers.utils.formatEther(subscription.totalPaid),
        totalRefunded: ethers.utils.formatEther(subscription.totalRefunded)
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get subscription', message: error.message });
    }
  });

  // Get system statistics
  app.get('/stats', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            disputes: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                resolved: { type: 'number' },
                permanentlyDeleted: { type: 'number' }
              }
            },
            subscriptions: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                active: { type: 'number' },
                totalPaid: { type: 'string' },
                totalRefunded: { type: 'string' }
              }
            },
            protectionPool: {
              type: 'object',
              properties: {
                balance: { type: 'string' },
                refundsPaid: { type: 'string' },
                activeSubscriptions: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const [totalDisputes, totalResolved, totalPermanentlyDeleted] = await disputeContract.getStats();
      const [poolBalance, refundsPaid, activeSubscriptions] = await protectionPoolContract.getPoolStats();
      
      return {
        disputes: {
          total: totalDisputes.toNumber(),
          resolved: totalResolved.toNumber(),
          permanentlyDeleted: totalPermanentlyDeleted.toNumber()
        },
        subscriptions: {
          total: activeSubscriptions.toNumber(),
          active: activeSubscriptions.toNumber(),
          totalPaid: ethers.utils.formatEther(poolBalance.add(refundsPaid)),
          totalRefunded: ethers.utils.formatEther(refundsPaid)
        },
        protectionPool: {
          balance: ethers.utils.formatEther(poolBalance),
          refundsPaid: ethers.utils.formatEther(refundsPaid),
          activeSubscriptions: activeSubscriptions.toNumber()
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
