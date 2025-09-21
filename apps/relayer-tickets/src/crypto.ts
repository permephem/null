import { createHmac, createHash, randomBytes } from "node:crypto";
import { ethers } from "ethers";

export type Hex = `0x${string}`;

export function holderTagHmac(identifier: string, venueKey: Buffer): Hex {
  const h = createHmac("sha256", venueKey);
  h.update(identifier.normalize("NFKC"));
  return `0x${h.digest("hex")}`;
}

export function keccakHex(data: string | Uint8Array): Hex {
  const bytes = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  return ethers.keccak256(bytes as any) as Hex;
}

export function commitEventId(eventId: string): Hex {
  return keccakHex(`event:${eventId}`);
}

export function commitTicketId(eventId: string, seatSerial: string): Hex {
  return keccakHex(`ticket:${eventId}:${seatSerial}`);
}

export function commitPolicy(policy: unknown): Hex {
  return keccakHex(`policy:${JSON.stringify(policy)}`);
}

export function randomSeatSerial(): string {
  return randomBytes(16).toString("hex");
}



