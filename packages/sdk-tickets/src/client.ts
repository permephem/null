import fetch from "cross-fetch";
import type {
  SdkConfig, IssueRequest, IssueResponse,
  TransferRequest, TransferResponse,
  RevokeRequest, RevokeResponse,
  VerifyRequest, VerifyResult, Hex
} from "./types.js";
import { commitEventId, commitPolicy, commitTicketId, holderTagHmac } from "./crypto.js";

export class NullTicketsClient {
  constructor(private cfg: SdkConfig) {}

  /** Primary sale → issue ticket + Canon ISSUANCE anchor (server-side relayer recommended). */
  async issue(req: IssueRequest): Promise<IssueResponse> {
    // Compute commitments client-side for transparency (server will recompute/verify)
    const event_id_commit = commitEventId(req.eventId);
    const seatSerial = req.seat; // or randomSeatSerial()
    const ticket_id_commit = commitTicketId(seatSerial, req.eventId);
    const policy_commit = commitPolicy(req.policy);
    const holder_tag = holderTagHmac(req.holderIdentifier, this.cfg.venueHmacKey);

    const res = await fetch(`${this.cfg.apiBase}/tickets/issue`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_id_commit,
        ticket_id_commit,
        policy_commit,
        holder_tag,
        assurance: req.assurance ?? 1,
        evidence: req.evidence ?? {},
        // opaque fields passed to relayer for evidence package construction:
        _eventId: req.eventId,
        _seat: req.seat,
        _holderIdentifier: req.holderIdentifier,
        _policy: req.policy
      })
    });
    if (!res.ok) throw new Error(`Issue failed: ${res.status} ${await res.text()}`);
    return (await res.json()) as IssueResponse;
  }

  /** Approved exchange transfer → Canon TRANSFER anchor. */
  async transfer(req: TransferRequest): Promise<TransferResponse> {
    const newHolderTag = holderTagHmac(req.toIdentifier, this.cfg.venueHmacKey);
    const res = await fetch(`${this.cfg.apiBase}/tickets/transfer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ticket_id_commit: req.ticketIdCommit,
        from_tag: holderTagHmac(req.fromIdentifier, this.cfg.venueHmacKey),
        to_tag: newHolderTag,
        assurance: req.assurance ?? 1,
        evidence: req.evidence ?? {}
      })
    });
    if (!res.ok) throw new Error(`Transfer failed: ${res.status} ${await res.text()}`);
    const out = (await res.json()) as TransferResponse;
    return { ...out, newHolderTag };
  }

  /** Policy breach/fraud → Canon REVOCATION anchor (Null Warrant). */
  async revoke(req: RevokeRequest): Promise<RevokeResponse> {
    const res = await fetch(`${this.cfg.apiBase}/tickets/revoke`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`Revoke failed: ${res.status} ${await res.text()}`);
    return (await res.json()) as RevokeResponse;
  }

  /** Gate verification (online). Use offline snapshot as fallback in the scanner app. */
  async verifyAtGate(req: VerifyRequest): Promise<VerifyResult> {
    const res = await fetch(`${this.cfg.apiBase}/tickets/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`Verify failed: ${res.status} ${await res.text()}`);
    return (await res.json()) as VerifyResult;
  }
}



