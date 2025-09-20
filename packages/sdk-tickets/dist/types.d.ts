export type Hex = `0x${string}`;
export type Assurance = 0 | 1 | 2 | 3;
export interface TicketPolicy {
    maxResalePct?: number;
    transferWindowHours?: number;
    kycLevel?: "none" | "light" | "full";
    resaleOnlyVia?: string[];
}
export interface IssueRequest {
    eventId: string;
    seat: string;
    holderIdentifier: string;
    policy: TicketPolicy;
    assurance?: Assurance;
    evidence?: Record<string, unknown>;
}
export interface IssueResponse {
    ticketIdCommit: Hex;
    canonTx: Hex;
    credential?: unknown;
    tokenId?: string;
}
export interface TransferRequest {
    ticketIdCommit: Hex;
    fromIdentifier: string;
    toIdentifier: string;
    assurance?: Assurance;
    evidence?: Record<string, unknown>;
}
export interface TransferResponse {
    canonTx: Hex;
    newHolderTag: Hex;
}
export interface RevokeRequest {
    ticketIdCommit: Hex;
    reason: "policy_breach" | "fraud" | "chargeback" | "refund_cancelled" | "lost_stolen";
    evidence?: Record<string, unknown>;
    assurance?: Assurance;
}
export interface RevokeResponse {
    canonTx: Hex;
    tombstoneUri?: string;
}
export interface VerifyRequest {
    ticketQrPayload: string;
    holderProof: string;
}
export interface VerifyResult {
    decision: "ALLOW" | "DENY";
    reason?: string;
    canonRef?: Hex;
}
export interface CanonAnchorPayload {
    ticket_id_commit: Hex;
    event_id_commit: Hex;
    holder_tag: Hex;
    policy_commit: Hex;
    op_type: "ISSUANCE" | "TRANSFER" | "REVOCATION" | "ENTRY_OK" | "ENTRY_DENY";
    assurance: Assurance;
    uri: string;
}
export interface SdkConfig {
    apiBase: string;
    canonContract: string;
    foundationAddress: string;
    venueHmacKey: Uint8Array;
    signer?: import("ethers").Signer;
}
