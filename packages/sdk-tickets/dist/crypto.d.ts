import type { Hex } from "./types.js";
/** HMAC-based privacy tag for holder identity (never put PII on-chain). */
export declare function holderTagHmac(identifier: string, venueHmacKey: Uint8Array): Hex;
/** Commitments for event/ticket/policy; use Keccak-256 to align with EVM hashing. */
export declare function keccakHex(data: string | Uint8Array): Hex;
export declare function commitEventId(eventId: string): Hex;
export declare function commitTicketId(ticketSerial: string, eventId: string): Hex;
export declare function commitPolicy(policy: unknown): Hex;
/** Random opaque seat serial (when venue doesn't want to expose seat string). */
export declare function randomSeatSerial(): string;
