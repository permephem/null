import { createHmac, randomBytes } from "node:crypto";
import { ethers } from "ethers";
export function holderTagHmac(identifier, venueKey) {
    const h = createHmac("sha256", venueKey);
    h.update(identifier.normalize("NFKC"));
    return `0x${h.digest("hex")}`;
}
export function keccakHex(data) {
    const bytes = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    return ethers.keccak256(bytes);
}
export function commitEventId(eventId) {
    return keccakHex(`event:${eventId}`);
}
export function commitTicketId(eventId, seatSerial) {
    return keccakHex(`ticket:${eventId}:${seatSerial}`);
}
export function commitPolicy(policy) {
    return keccakHex(`policy:${JSON.stringify(policy)}`);
}
export function randomSeatSerial() {
    return randomBytes(16).toString("hex");
}
