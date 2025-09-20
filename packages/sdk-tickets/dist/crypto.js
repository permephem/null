import { createHmac, randomBytes } from "node:crypto";
import { keccak256 } from "ethers";
/** HMAC-based privacy tag for holder identity (never put PII on-chain). */
export function holderTagHmac(identifier, venueHmacKey) {
    const h = createHmac("sha256", Buffer.from(venueHmacKey));
    h.update(identifier.normalize("NFKC"));
    return `0x${h.digest("hex")}`;
}
/** Commitments for event/ticket/policy; use Keccak-256 to align with EVM hashing. */
export function keccakHex(data) {
    const buf = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    // Use ethers.keccak256 for EVM-accurate hashing
    return keccak256(buf);
}
export function commitEventId(eventId) {
    return keccakHex(`event:${eventId}`);
}
export function commitTicketId(ticketSerial, eventId) {
    return keccakHex(`ticket:${eventId}:${ticketSerial}`);
}
export function commitPolicy(policy) {
    const json = JSON.stringify(policy);
    return keccakHex(`policy:${json}`);
}
/** Random opaque seat serial (when venue doesn't want to expose seat string). */
export function randomSeatSerial() {
    return randomBytes(16).toString("hex");
}
