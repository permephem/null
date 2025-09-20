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

// CanonHealth contract ABI
const CANON_HEALTH_ABI = [
  "event HealthcareEventAnchored(bytes32 indexed patientCommit, bytes32 indexed recordCommit, bytes32 indexed consentCommit, bytes32 providerCommit, uint8 operation, uint8 assurance, uint256 timestamp, string evidenceUri, address indexedBy)",
  "event ConsentGranted(bytes32 indexed patientCommit, bytes32 indexed consentCommit, address indexed provider, uint256 timestamp)",
  "event ConsentRevoked(bytes32 indexed patientCommit, bytes32 indexed consentCommit, address indexed provider, uint256 timestamp)",
  "event BreachReported(bytes32 indexed patientCommit, bytes32 indexed recordCommit, address indexed reporter, uint256 timestamp, string evidenceUri)"
];

// Healthcare operation types
enum OperationType {
  CONSENT_GRANT = 0,
  CONSENT_REVOKE = 1,
  RECORD_ANCHOR = 2,
  RECORD_UPDATE = 3,
  TRIAL_CONSENT = 4,
  TRIAL_DATA = 5,
  ACCESS_LOG = 6,
  BREACH_REPORT = 7
}

// Assurance levels
enum AssuranceLevel {
  NONE = 0,
  BASIC = 1,
  VERIFIED = 2,
  ATTESTED = 3,
  CERTIFIED = 4
}

// Database operations
async function upsertHealthcareEvent(event: {
  canonTx: string;
  blockNumber: number;
  blockTime: Date;
  patientCommit: string;
  recordCommit: string;
  consentCommit: string;
  providerCommit: string;
  operation: number;
  assurance: number;
  evidenceUri: string;
  indexedBy: string;
}) {
  await pool.query(
    `INSERT INTO healthcare_events
      (canon_tx_hash, block_number, block_time, patient_commit, record_commit, consent_commit, provider_commit, operation_type, assurance_level, evidence_uri, indexed_by)
     VALUES ($1, $2, $3, decode($4, 'hex'), decode($5, 'hex'), decode($6, 'hex'), decode($7, 'hex'), $8, $9, $10, $11)
     ON CONFLICT (canon_tx_hash) DO NOTHING`,
    [
      event.canonTx,
      event.blockNumber,
      event.blockTime,
      event.patientCommit.replace(/^0x/, ""),
      event.recordCommit.replace(/^0x/, ""),
      event.consentCommit.replace(/^0x/, ""),
      event.providerCommit.replace(/^0x/, ""),
      event.operation,
      event.assurance,
      event.evidenceUri,
      event.indexedBy
    ]
  );
}

async function updateConsentStatus(patientCommit: string, hasConsent: boolean, canonTx: string) {
  await pool.query(
    `INSERT INTO patient_consent_status
       (patient_commit, has_consent, last_updated_tx, updated_at)
     VALUES (decode($1, 'hex'), $2, $3, NOW())
     ON CONFLICT (patient_commit)
     DO UPDATE SET has_consent = EXCLUDED.has_consent,
                   last_updated_tx = EXCLUDED.last_updated_tx,
                   updated_at = NOW()`,
    [
      patientCommit.replace(/^0x/, ""),
      hasConsent,
      canonTx
    ]
  );
}

async function updateRecordAccess(recordCommit: string, accessTime: Date, canonTx: string) {
  await pool.query(
    `INSERT INTO record_access_log
       (record_commit, last_access_time, last_access_tx, updated_at)
     VALUES (decode($1, 'hex'), $2, $3, NOW())
     ON CONFLICT (record_commit)
     DO UPDATE SET last_access_time = EXCLUDED.last_access_time,
                   last_access_tx = EXCLUDED.last_access_tx,
                   updated_at = NOW()`,
    [
      recordCommit.replace(/^0x/, ""),
      accessTime,
      canonTx
    ]
  );
}

async function logBreachReport(patientCommit: string, recordCommit: string, reporter: string, canonTx: string, evidenceUri: string) {
  await pool.query(
    `INSERT INTO breach_reports
       (patient_commit, record_commit, reporter, canon_tx, evidence_uri, reported_at)
     VALUES (decode($1, 'hex'), decode($2, 'hex'), $3, $4, $5, NOW())`,
    [
      patientCommit.replace(/^0x/, ""),
      recordCommit.replace(/^0x/, ""),
      reporter,
      canonTx,
      evidenceUri
    ]
  );
}

// Main indexer function
async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
  const contract = new ethers.Contract(
    process.env.CANON_HEALTH_ADDRESS!,
    CANON_HEALTH_ABI,
    provider
  );
  
  const startBlock = Number(process.env.START_BLOCK || "0");
  const confirmations = Number(process.env.CONFIRMATIONS || "5");
  
  console.log(`🏥 Healthcare indexer starting from block ${startBlock}`);
  
  // Listen for HealthcareEventAnchored events
  contract.on("HealthcareEventAnchored", async (
    patientCommit,
    recordCommit,
    consentCommit,
    providerCommit,
    operation,
    assurance,
    timestamp,
    evidenceUri,
    indexedBy,
    event
  ) => {
    try {
      const block = await event.getBlock();
      
      // Store the event
      await upsertHealthcareEvent({
        canonTx: event.transactionHash,
        blockNumber: event.blockNumber,
        blockTime: new Date(Number(block.timestamp) * 1000),
        patientCommit,
        recordCommit,
        consentCommit,
        providerCommit,
        operation: Number(operation),
        assurance: Number(assurance),
        evidenceUri,
        indexedBy
      });
      
      // Update consent status
      if (operation === OperationType.CONSENT_GRANT) {
        await updateConsentStatus(patientCommit, true, event.transactionHash);
      } else if (operation === OperationType.CONSENT_REVOKE) {
        await updateConsentStatus(patientCommit, false, event.transactionHash);
      }
      
      // Update record access
      if (operation === OperationType.ACCESS_LOG) {
        await updateRecordAccess(recordCommit, new Date(Number(block.timestamp) * 1000), event.transactionHash);
      }
      
      // Log breach reports
      if (operation === OperationType.BREACH_REPORT) {
        await logBreachReport(patientCommit, recordCommit, indexedBy, event.transactionHash, evidenceUri);
      }
      
      console.log(`✅ Indexed healthcare event: ${event.transactionHash}`);
    } catch (error) {
      console.error("❌ Error indexing healthcare event:", error);
    }
  });
  
  // Listen for ConsentGranted events
  contract.on("ConsentGranted", async (patientCommit, consentCommit, provider, timestamp, event) => {
    try {
      console.log(`✅ Consent granted: ${event.transactionHash}`);
    } catch (error) {
      console.error("❌ Error processing consent granted:", error);
    }
  });
  
  // Listen for ConsentRevoked events
  contract.on("ConsentRevoked", async (patientCommit, consentCommit, provider, timestamp, event) => {
    try {
      console.log(`✅ Consent revoked: ${event.transactionHash}`);
    } catch (error) {
      console.error("❌ Error processing consent revoked:", error);
    }
  });
  
  // Listen for BreachReported events
  contract.on("BreachReported", async (patientCommit, recordCommit, reporter, timestamp, evidenceUri, event) => {
    try {
      console.log(`🚨 Breach reported: ${event.transactionHash}`);
    } catch (error) {
      console.error("❌ Error processing breach report:", error);
    }
  });
  
  console.log("🏥 Healthcare indexer listening for events...");
}

// Error handling
main().catch(async (error) => {
  console.error("❌ Healthcare indexer error:", error);
  await pool.end();
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log("🛑 Shutting down healthcare indexer...");
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log("🛑 Shutting down healthcare indexer...");
  await pool.end();
  process.exit(0);
});
