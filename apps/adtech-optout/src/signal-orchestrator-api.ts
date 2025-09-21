import Fastify, { FastifyInstance } from 'fastify';
import { ethers } from 'ethers';
import { z } from 'zod';

// Types based on the new architecture
interface ConsentState {
  user_id: string;
  preferences: {
    do_not_sell: boolean;
    gpc_enabled: boolean;
    vendor_categories: {
      analytics: boolean;
      advertising: boolean;
      functional: boolean;
    };
  };
  signature: string;
  timestamp: string;
  version: number;
}

interface VendorRegistry {
  vendor_id: string;
  categories: string[];
  opt_out: {
    method: string;
    endpoint: string;
    requires: string[];
    evidence_expected: string[];
  };
  gpc_policy: {
    honors: boolean;
    ttl_days: number;
  };
  jurisdictions: string[];
}

interface AuditManifest {
  run_id: string;
  user_policy_hash: string;
  sites: string[];
  modes: string[];
  artifacts: string[];
  detected_events: Array<{
    type: string;
    vendor: string;
    mode: string;
    evidence: string;
  }>;
  compliance_score: number;
}

interface ViolationReport {
  violation_id: string;
  vendor_id: string;
  site: string;
  violation_type: string;
  evidence: {
    har_file: string;
    screenshot: string;
    console_logs: string;
  };
  severity: number;
  jurisdiction: string;
  detected_at: string;
}

// Validation schemas
const ConsentStateSchema = z.object({
  user_id: z.string(),
  preferences: z.object({
    do_not_sell: z.boolean(),
    gpc_enabled: z.boolean(),
    vendor_categories: z.object({
      analytics: z.boolean(),
      advertising: z.boolean(),
      functional: z.boolean()
    })
  }),
  signature: z.string(),
  timestamp: z.string(),
  version: z.number()
});

const VendorRegistrySchema = z.object({
  vendor_id: z.string(),
  categories: z.array(z.string()),
  opt_out: z.object({
    method: z.string(),
    endpoint: z.string().url(),
    requires: z.array(z.string()),
    evidence_expected: z.array(z.string())
  }),
  gpc_policy: z.object({
    honors: z.boolean(),
    ttl_days: z.number()
  }),
  jurisdictions: z.array(z.string())
});

const AuditManifestSchema = z.object({
  run_id: z.string(),
  user_policy_hash: z.string(),
  sites: z.array(z.string()),
  modes: z.array(z.string()),
  artifacts: z.array(z.string()),
  detected_events: z.array(z.object({
    type: z.string(),
    vendor: z.string(),
    mode: z.string(),
    evidence: z.string()
  })),
  compliance_score: z.number().min(0).max(100)
});

const ViolationReportSchema = z.object({
  violation_id: z.string(),
  vendor_id: z.string(),
  site: z.string(),
  violation_type: z.enum([
    'cookie_drop_after_optout',
    'bidstream_call_after_optout',
    'fingerprinting_after_optout',
    'localStorage_access_after_optout',
    'cross_site_tracking_after_optout',
    'gpc_ignored',
    'do_not_sell_ignored'
  ]),
  evidence: z.object({
    har_file: z.string(),
    screenshot: z.string(),
    console_logs: z.string()
  }),
  severity: z.number().min(1).max(10),
  jurisdiction: z.string(),
  detected_at: z.string()
});

// Contract interfaces
const VendorRegistryABI = [
  "function registerVendor(string,string,string,uint8[],tuple(string,string,string[],string[],uint256,bool),tuple(bool,uint256,string[],bool),uint8[]) external",
  "function updateVendor(string,string,string) external",
  "function updateVendorCompliance(string,bool,uint256,uint256) external",
  "function blacklistVendor(string,string) external",
  "function getVendor(string) external view returns (tuple(string,string,string,uint8[],tuple(string,string,string[],string[],uint256,bool),tuple(bool,uint256,string[],bool),uint8[],bool,uint256,uint256,bool,uint256,address))",
  "function getStats() external view returns (uint256,uint256,uint256)",
  "event VendorRegistered(string,string,string,uint8[],address)",
  "event VendorComplianceUpdated(string,bool,uint256,uint256)"
];

const ConsentVaultABI = [
  "function storeConsentState(string,string,string) external returns (bytes32)",
  "function getConsentState(string) external view returns (tuple(string,string,string,string,uint256,uint256))",
  "function verifyConsentSignature(string,string) external view returns (bool)",
  "function getConsentHistory(string) external view returns (tuple(string,string,string,string,uint256,uint256)[])",
  "event ConsentStateStored(string,bytes32,string,uint256)"
];

const EvidenceLockerABI = [
  "function storeEvidence(string,string,string) external returns (bytes32)",
  "function getEvidence(bytes32) external view returns (tuple(string,string,string,uint256,string))",
  "function verifyEvidenceIntegrity(bytes32) external view returns (bool)",
  "function getEvidenceManifest(string) external view returns (tuple(string,string[],string[],uint256,string))",
  "event EvidenceStored(bytes32,string,string,uint256)"
];

// Utility functions
function hashConsentState(consentState: ConsentState): string {
  const consentString = JSON.stringify(consentState);
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(consentString + process.env.CONSENT_SALT));
}

async function pinToIPFS(data: any): Promise<string> {
  // Implementation would pin data to IPFS and return URI
  // This is a placeholder
  return `ipfs://Qm${Math.random().toString(36).substring(2)}`;
}

// Contract instances
let vendorRegistryContract: ethers.Contract;
let consentVaultContract: ethers.Contract;
let evidenceLockerContract: ethers.Contract;

export async function registerSignalOrchestratorRoutes(app: FastifyInstance) {
  // Initialize contracts
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  vendorRegistryContract = new ethers.Contract(
    process.env.VENDOR_REGISTRY_CONTRACT!,
    VendorRegistryABI,
    wallet
  );
  
  consentVaultContract = new ethers.Contract(
    process.env.CONSENT_VAULT_CONTRACT!,
    ConsentVaultABI,
    wallet
  );
  
  evidenceLockerContract = new ethers.Contract(
    process.env.EVIDENCE_LOCKER_CONTRACT!,
    EvidenceLockerABI,
    wallet
  );

  // Store consent state
  app.post('/consent/store', {
    schema: {
      body: ConsentStateSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            user_id: { type: 'string' },
            consent_hash: { type: 'string' },
            canon_tx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const consentState = request.body as ConsentState;
      
      // Generate consent hash
      const consentHash = hashConsentState(consentState);
      
      // Store consent state on contract
      const tx = await consentVaultContract.storeConsentState(
        consentState.user_id,
        JSON.stringify(consentState),
        consentState.signature
      );
      
      const receipt = await tx.wait();
      const storedHash = receipt.events[0].args[1]; // Assuming consent hash is second arg
      
      return {
        user_id: consentState.user_id,
        consent_hash: storedHash,
        canon_tx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to store consent state', message: error.message });
    }
  });

  // Get consent state
  app.get('/consent/:userId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user_id: { type: 'string' },
            consent_state: { type: 'object' },
            signature: { type: 'string' },
            timestamp: { type: 'string' },
            version: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      const consentState = await consentVaultContract.getConsentState(userId);
      
      return {
        user_id: consentState.user_id,
        consent_state: JSON.parse(consentState.consent_data),
        signature: consentState.signature,
        timestamp: new Date(consentState.timestamp.toNumber() * 1000).toISOString(),
        version: consentState.version.toNumber()
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get consent state', message: error.message });
    }
  });

  // Register vendor
  app.post('/vendor/register', {
    schema: {
      body: VendorRegistrySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            vendor_id: { type: 'string' },
            canon_tx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const vendorRegistry = request.body as VendorRegistry;
      
      // Convert categories to enum values
      const categoryMap: Record<string, number> = {
        'dsp': 0,
        'ssp': 1,
        'cdp': 2,
        'cmp': 3,
        'dmp': 4,
        'analytics': 5,
        'retargeting': 6,
        'fingerprinting': 7,
        'cross_site_tracking': 8
      };
      
      const categories = vendorRegistry.categories.map(cat => categoryMap[cat] || 0);
      
      // Convert jurisdictions to enum values
      const jurisdictionMap: Record<string, number> = {
        'us_cpra': 0,
        'eu_gdpr': 1,
        'us_coppa': 2,
        'us_vcdpa': 3,
        'us_ctdpa': 4,
        'us_cpa': 5,
        'us_ucpa': 6,
        'us_tcpa': 7,
        'us_mtcdpa': 8,
        'us_orcdpa': 9
      };
      
      const jurisdictions = vendorRegistry.jurisdictions.map(jur => jurisdictionMap[jur] || 0);
      
      // Create opt-out endpoint tuple
      const optOutEndpoint = [
        vendorRegistry.opt_out.method,
        vendorRegistry.opt_out.endpoint,
        vendorRegistry.opt_out.requires,
        vendorRegistry.opt_out.evidence_expected,
        vendorRegistry.gpc_policy.ttl_days,
        true // active
      ];
      
      // Create GPC policy tuple
      const gpcPolicy = [
        vendorRegistry.gpc_policy.honors,
        vendorRegistry.gpc_policy.ttl_days,
        [], // required headers (empty for now)
        true // active
      ];
      
      // Register vendor on contract
      const tx = await vendorRegistryContract.registerVendor(
        vendorRegistry.vendor_id,
        vendorRegistry.vendor_id, // name (same as ID for now)
        vendorRegistry.vendor_id, // domain (same as ID for now)
        categories,
        optOutEndpoint,
        gpcPolicy,
        jurisdictions
      );
      
      await tx.wait();
      
      return {
        vendor_id: vendorRegistry.vendor_id,
        canon_tx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to register vendor', message: error.message });
    }
  });

  // Get vendor information
  app.get('/vendor/:vendorId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          vendorId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            vendor_id: { type: 'string' },
            name: { type: 'string' },
            domain: { type: 'string' },
            categories: { type: 'array', items: { type: 'string' } },
            opt_out: { type: 'object' },
            gpc_policy: { type: 'object' },
            jurisdictions: { type: 'array', items: { type: 'string' } },
            compliant: { type: 'boolean' },
            violations: { type: 'number' },
            last_violation: { type: 'number' },
            blacklisted: { type: 'boolean' },
            registered_at: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { vendorId } = request.params as { vendorId: string };
      
      const vendor = await vendorRegistryContract.getVendor(vendorId);
      
      // Convert categories back to strings
      const categoryMap = ['dsp', 'ssp', 'cdp', 'cmp', 'dmp', 'analytics', 'retargeting', 'fingerprinting', 'cross_site_tracking'];
      const categories = vendor.categories.map((cat: any) => categoryMap[cat.toNumber()] || 'unknown');
      
      // Convert jurisdictions back to strings
      const jurisdictionMap = ['us_cpra', 'eu_gdpr', 'us_coppa', 'us_vcdpa', 'us_ctdpa', 'us_cpa', 'us_ucpa', 'us_tcpa', 'us_mtcdpa', 'us_orcdpa'];
      const jurisdictions = vendor.jurisdictions.map((jur: any) => jurisdictionMap[jur.toNumber()] || 'unknown');
      
      return {
        vendor_id: vendor.vendorId,
        name: vendor.name,
        domain: vendor.domain,
        categories,
        opt_out: {
          method: vendor.optOut.method,
          endpoint: vendor.optOut.endpoint,
          requires: vendor.optOut.requiredParams,
          evidence_expected: vendor.optOut.evidenceExpected,
          ttl_days: vendor.optOut.ttlDays.toNumber(),
          active: vendor.optOut.active
        },
        gpc_policy: {
          honors: vendor.gpcPolicy.honors,
          ttl_days: vendor.gpcPolicy.ttlDays.toNumber(),
          required_headers: vendor.gpcPolicy.requiredHeaders,
          active: vendor.gpcPolicy.active
        },
        jurisdictions,
        compliant: vendor.compliant,
        violations: vendor.violations.toNumber(),
        last_violation: vendor.lastViolation.toNumber(),
        blacklisted: vendor.blacklisted,
        registered_at: vendor.registeredAt.toNumber()
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get vendor information', message: error.message });
    }
  });

  // Store audit manifest
  app.post('/audit/store', {
    schema: {
      body: AuditManifestSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            run_id: { type: 'string' },
            manifest_hash: { type: 'string' },
            canon_tx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const auditManifest = request.body as AuditManifest;
      
      // Store audit manifest on IPFS
      const manifestUri = await pinToIPFS(auditManifest);
      
      // Store evidence in Evidence Locker
      const tx = await evidenceLockerContract.storeEvidence(
        auditManifest.run_id,
        manifestUri,
        JSON.stringify(auditManifest)
      );
      
      const receipt = await tx.wait();
      const manifestHash = receipt.events[0].args[0]; // Assuming manifest hash is first arg
      
      return {
        run_id: auditManifest.run_id,
        manifest_hash: manifestHash,
        canon_tx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to store audit manifest', message: error.message });
    }
  });

  // Store violation report
  app.post('/violation/store', {
    schema: {
      body: ViolationReportSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            violation_id: { type: 'string' },
            evidence_hash: { type: 'string' },
            canon_tx: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const violationReport = request.body as ViolationReport;
      
      // Store violation report on IPFS
      const reportUri = await pinToIPFS(violationReport);
      
      // Store evidence in Evidence Locker
      const tx = await evidenceLockerContract.storeEvidence(
        violationReport.violation_id,
        reportUri,
        JSON.stringify(violationReport)
      );
      
      const receipt = await tx.wait();
      const evidenceHash = receipt.events[0].args[0]; // Assuming evidence hash is first arg
      
      return {
        violation_id: violationReport.violation_id,
        evidence_hash: evidenceHash,
        canon_tx: tx.hash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to store violation report', message: error.message });
    }
  });

  // Get evidence
  app.get('/evidence/:evidenceHash', {
    schema: {
      params: {
        type: 'object',
        properties: {
          evidenceHash: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            evidence_hash: { type: 'string' },
            evidence_type: { type: 'string' },
            evidence_uri: { type: 'string' },
            evidence_data: { type: 'object' },
            timestamp: { type: 'string' },
            integrity_hash: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { evidenceHash } = request.params as { evidenceHash: string };
      
      const evidence = await evidenceLockerContract.getEvidence(evidenceHash);
      
      return {
        evidence_hash: evidenceHash,
        evidence_type: evidence.evidenceType,
        evidence_uri: evidence.evidenceUri,
        evidence_data: JSON.parse(evidence.evidenceData),
        timestamp: new Date(evidence.timestamp.toNumber() * 1000).toISOString(),
        integrity_hash: evidence.integrityHash
      };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get evidence', message: error.message });
    }
  });

  // Get system statistics
  app.get('/stats', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            vendors: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                violations: { type: 'number' },
                blacklisted: { type: 'number' }
              }
            },
            consent: {
              type: 'object',
              properties: {
                total_states: { type: 'number' },
                active_users: { type: 'number' }
              }
            },
            evidence: {
              type: 'object',
              properties: {
                total_artifacts: { type: 'number' },
                total_size: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const [totalVendors, totalViolations, totalBlacklisted] = await vendorRegistryContract.getStats();
      
      return {
        vendors: {
          total: totalVendors.toNumber(),
          violations: totalViolations.toNumber(),
          blacklisted: totalBlacklisted.toNumber()
        },
        consent: {
          total_states: 0, // Would need to implement this
          active_users: 0 // Would need to implement this
        },
        evidence: {
          total_artifacts: 0, // Would need to implement this
          total_size: "0 MB" // Would need to implement this
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
