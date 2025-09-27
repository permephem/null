import { createHmac, randomBytes, createHash } from "node:crypto";
import { keccak256 } from "ethers";
import type { Hex } from "./types.js";

/** HMAC-based privacy tag for holder identity (never put PII on-chain). */
export function holderTagHmac(identifier: string, venueHmacKey: Uint8Array): Hex {
  const h = createHmac("sha256", Buffer.from(venueHmacKey));
  h.update(identifier.normalize("NFKC"));
  return `0x${h.digest("hex")}`;
}

/** Commitments for event/ticket/policy; use Keccak-256 to align with EVM hashing. */
export function keccakHex(data: string | Uint8Array): Hex {
  const buf = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  // Use ethers.keccak256 for EVM-accurate hashing
  return keccak256(buf) as Hex;
}

export function commitEventId(eventId: string): Hex {
  return keccakHex(`event:${eventId}`);
}

export function commitTicketId(ticketSerial: string, eventId: string): Hex {
  return keccakHex(`ticket:${eventId}:${ticketSerial}`);
}

/**
 * Canonicalize JSON data according to RFC 8785 (JCS) by recursively
 * sorting object keys while leaving arrays untouched.
 */
export function canonicalizeJSON(data: unknown): string {
  return JSON.stringify(canonicalizeValue(data));
}

function canonicalizeValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeValue(item));
  }

  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const canonicalized: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    canonicalized[key] = canonicalizeValue(obj[key]);
  }

  return canonicalized;
}

export function commitPolicy(policy: unknown): Hex {
  const json = canonicalizeJSON(policy);
  return keccakHex(`policy:${json}`);
}

/** Random opaque seat serial (when venue doesn't want to expose seat string). */
export function randomSeatSerial(): string {
  return randomBytes(16).toString("hex");
}



