export type Hex = `0x${string}`;

export type Assurance = 0 | 1 | 2 | 3; // 0=DKIM, 1=DID/JWS, 2=TEE/HSM, 3=ZK

export interface TicketPolicy {
  maxResalePct?: number;           // e.g., 110 = 110% of face value
  transferWindowHours?: number;    // e.g., 48
  kycLevel?: "none" | "light" | "full";
  resaleOnlyVia?: string[];        // whitelisted exchanges by DID/URL
}

export interface IssueRequest {
  eventId: string;                 // opaque string from venue
  seat: string;                    // "Sec 112 Row D Seat 8" or internal seat id
  holderIdentifier: string;        // email/phone/wallet DID (not on-chain)
  policy: TicketPolicy;
  assurance?: Assurance;
  evidence?: Record<string, unknown>; // optional extra evidence
}

export interface IssueResponse {
  ticketIdCommit: Hex;
  canonTx: Hex;
  credential?: unknown;            // VC blob if using credential mode
  tokenId?: string;                // if using ERC-721 mode
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
  reason:
    | "policy_breach"
    | "fraud"
    | "chargeback"
    | "refund_cancelled"
    | "lost_stolen";
  evidence?: Record<string, unknown>;
  assurance?: Assurance;
}

export interface RevokeResponse {
  canonTx: Hex;
  tombstoneUri?: string;
}

export interface VerifyRequest {
  ticketQrPayload: string; // includes ticketId and session token
  holderProof: string;     // OTP code or wallet signature
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
  uri: string;  // IPFS/https evidence pointer
}

export interface SdkConfig {
  apiBase: string;                // your relayer base URL, e.g. https://relay.null.xyz
  canonContract: string;          // CanonRegistry address
  foundationAddress: string;      // Foundation treasury
  venueHmacKey: Uint8Array;       // secret per-venue key for HMAC (keep off-client if possible)
  signer?: import("ethers").Signer; // ethers Signer for EIP-712 or on-chain actions (if needed)
}
