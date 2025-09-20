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
  const base = process.env.PINNER_BASE || "http://localhost:8789";
  const token = process.env.PINNER_TOKEN || "";
  const res = await fetch(`${base}/pin/json`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(signed)
  });
  if (!res.ok) throw new Error(`Pin failed: ${res.status} ${await res.text()}`);
  const out = await res.json();
  return out.uri as string;
}


