import fetch from "cross-fetch";
import { commitEventId, commitPolicy, commitTicketId, holderTagHmac } from "./crypto.js";
export class NullTicketsClient {
    cfg;
    constructor(cfg) {
        this.cfg = cfg;
    }
    /** Primary sale → issue ticket + Canon ISSUANCE anchor (server-side relayer recommended). */
    async issue(req) {
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
        if (!res.ok)
            throw new Error(`Issue failed: ${res.status} ${await res.text()}`);
        return (await res.json());
    }
    /** Approved exchange transfer → Canon TRANSFER anchor. */
    async transfer(req) {
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
        if (!res.ok)
            throw new Error(`Transfer failed: ${res.status} ${await res.text()}`);
        const out = (await res.json());
        return { ...out, newHolderTag };
    }
    /** Policy breach/fraud → Canon REVOCATION anchor (Null Warrant). */
    async revoke(req) {
        const res = await fetch(`${this.cfg.apiBase}/tickets/revoke`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(req)
        });
        if (!res.ok)
            throw new Error(`Revoke failed: ${res.status} ${await res.text()}`);
        return (await res.json());
    }
    /** Gate verification (online). Use offline snapshot as fallback in the scanner app. */
    async verifyAtGate(req) {
        const res = await fetch(`${this.cfg.apiBase}/tickets/verify`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(req)
        });
        if (!res.ok)
            throw new Error(`Verify failed: ${res.status} ${await res.text()}`);
        return (await res.json());
    }
}
