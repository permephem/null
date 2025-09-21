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

export function commitPolicy(policy: unknown): Hex {
  const json = JSON.stringify(policy);
  return keccakHex(`policy:${json}`);
}

/** Random opaque seat serial (when venue doesn't want to expose seat string). */
export function randomSeatSerial(): string {
  return randomBytes(16).toString("hex");
}



