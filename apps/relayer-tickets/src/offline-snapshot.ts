import { createHash } from "node:crypto";
import { getState } from "./indexer.js";

/**
 * Generate a signed Merkle snapshot for offline gate operations
 * This creates a signed allowlist that scanners can use when Canon is unavailable
 */

interface SnapshotEntry {
  ticketIdCommit: string;
  holderTag: string;
  state: string;
  lastCanonTx: string;
}

interface Snapshot {
  version: string;
  timestamp: string;
  venue: string;
  event: string;
  entries: SnapshotEntry[];
  merkleRoot: string;
  signature: string;
}

function buildMerkleTree(entries: SnapshotEntry[]): string {
  // Simple Merkle tree implementation
  const hashes = entries.map(entry => 
    createHash('sha256')
      .update(JSON.stringify(entry))
      .digest('hex')
  );

  let currentLevel = hashes;
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left;
      const combined = createHash('sha256')
        .update(left + right)
        .digest('hex');
      nextLevel.push(combined);
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

function signSnapshot(snapshot: Omit<Snapshot, 'signature'>): string {
  // In production, use proper cryptographic signing (e.g., Ed25519, ECDSA)
  // For now, return a stub signature
  const data = JSON.stringify(snapshot);
  return createHash('sha256')
    .update(data + process.env.VENUE_HMAC_KEY)
    .digest('hex');
}

export async function generateOfflineSnapshot(venue: string, event: string): Promise<Snapshot> {
  console.log(`📸 Generating offline snapshot for ${venue}/${event}`);
  
  // Get all current ticket states
  const entries: SnapshotEntry[] = [];
  // Note: This is a stub - in production, query the actual database
  // const states = await getAllTicketStates();
  
  const merkleRoot = buildMerkleTree(entries);
  
  const snapshot: Omit<Snapshot, 'signature'> = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    venue,
    event,
    entries,
    merkleRoot
  };

  const signature = signSnapshot(snapshot);

  return {
    ...snapshot,
    signature
  };
}

export function verifySnapshot(snapshot: Snapshot): boolean {
  const { signature, ...data } = snapshot;
  const expectedSignature = signSnapshot(data);
  return signature === expectedSignature;
}

export function findTicketInSnapshot(snapshot: Snapshot, ticketIdCommit: string): SnapshotEntry | null {
  return snapshot.entries.find(entry => entry.ticketIdCommit === ticketIdCommit) || null;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const venue = process.argv[2] || "demo-venue";
  const event = process.argv[3] || "demo-event";
  
  generateOfflineSnapshot(venue, event)
    .then(snapshot => {
      console.log(JSON.stringify(snapshot, null, 2));
    })
    .catch(console.error);
}
