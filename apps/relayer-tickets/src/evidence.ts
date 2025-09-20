import { randomUUID } from "node:crypto";

type EvidenceIn = {
  version: string;
  issuer: string;           // issuer DID, e.g., did:venue:abc
  event: { id: string; seat?: string };
  policy: unknown;
  operation: "ISSUANCE" | "TRANSFER" | "REVOCATION";
  from_did?: string;
  to_did?: string;
  timestamp: string;        // ISO8601
  canon_ref?: string;       // tx hash after anchor
  extra?: Record<string, unknown>;
};

export async function signEvidence(pkg: EvidenceIn): Promise<{ signed: any }> {
  // Stub: Replace with DID/JWS signing (e.g., did-jwt, jose)
  const signed = { ...pkg, signatures: [{ alg: "Ed25519", kid: "issuer-key", sig: "<stub>" }] };
  return { signed };
}

export async function pinEvidence(signed: any): Promise<string> {
  // Stub: Replace with IPFS/Arweave client; return a stable URI.
  // Example: ipfs://Qm... or https://evidence.null/uuid
  const id = randomUUID();
  return `https://evidence.null/${id}`;
}
