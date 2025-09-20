import { randomUUID } from "node:crypto";
export async function signEvidence(pkg) {
    // Stub: Replace with DID/JWS signing (e.g., did-jwt, jose)
    const signed = { ...pkg, signatures: [{ alg: "Ed25519", kid: "issuer-key", sig: "<stub>" }] };
    return { signed };
}
export async function pinEvidence(signed) {
    // Stub: Replace with IPFS/Arweave client; return a stable URI.
    // Example: ipfs://Qm... or https://evidence.null/uuid
    const id = randomUUID();
    return `https://evidence.null/${id}`;
}
