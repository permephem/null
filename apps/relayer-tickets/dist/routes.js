import { CONFIG } from "./config.js";
import { IssueBody, TransferBody, RevokeBody, VerifyBody } from "./schemas.js";
import { holderTagHmac, commitEventId, commitPolicy, commitTicketId } from "./crypto.js";
import { CanonClient } from "./canon.js";
import { signEvidence, pinEvidence } from "./evidence.js";
import { setState, getState } from "./indexer.js";
const canon = new CanonClient();
/** Helper to iso string now */
const nowISO = () => new Date().toISOString();
export async function registerRoutes(app) {
    // Health
    app.get("/healthz", async () => ({ ok: true }));
    // ISSUE
    app.post("/tickets/issue", async (req, reply) => {
        const body = IssueBody.parse(req.body);
        const eventCommit = commitEventId(body.eventId);
        const ticketCommit = commitTicketId(body.eventId, body.seat); // or use a server-side seat serial
        const policyCommit = commitPolicy(body.policy);
        const holderTag = holderTagHmac(body.holderIdentifier, CONFIG.VENUE_HMAC_KEY);
        const evidence = {
            version: "1.0",
            issuer: "did:venue:demo",
            event: { id: body.eventId, seat: body.seat },
            policy: body.policy,
            operation: "ISSUANCE",
            timestamp: nowISO(),
            extra: body.evidence ?? {}
        };
        const { signed } = await signEvidence(evidence);
        const uri = await pinEvidence(signed);
        const canonTx = await canon.anchorTickets({
            ticket_id_commit: ticketCommit,
            policy_commit: policyCommit,
            holder_tag: holderTag,
            assurance: body.assurance ?? 1,
            uri,
            feeWei: CONFIG.FEE_WEI_ISSUE
        });
        setState({
            ticketIdCommit: ticketCommit,
            holderTag,
            policyCommit,
            state: "ISSUED",
            lastCanonTx: canonTx
        });
        return reply.send({
            ticketIdCommit: ticketCommit,
            canonTx,
            credential: { stub: true } // if VC mode; or tokenId if ERC-721
        });
    });
    // TRANSFER
    app.post("/tickets/transfer", async (req, reply) => {
        const body = TransferBody.parse(req.body);
        const current = getState(body.ticketIdCommit);
        if (!current)
            return reply.code(404).send({ error: "UNKNOWN_TICKET" });
        if (current.state === "REVOKED")
            return reply.code(400).send({ error: "REVOKED" });
        const fromTag = holderTagHmac(body.fromIdentifier, CONFIG.VENUE_HMAC_KEY);
        if (fromTag !== current.holderTag)
            return reply.code(403).send({ error: "NOT_CURRENT_HOLDER" });
        // Policy enforcement (time windows, price caps, KYC) would be checked here.
        const toTag = holderTagHmac(body.toIdentifier, CONFIG.VENUE_HMAC_KEY);
        const evidence = {
            version: "1.0",
            issuer: "did:venue:demo",
            event: { id: "<redacted>" }, // optional extra context
            policy: { commit: current.policyCommit },
            operation: "TRANSFER",
            from_did: "<redacted>",
            to_did: "<redacted>",
            timestamp: nowISO(),
            extra: body.evidence ?? {}
        };
        const { signed } = await signEvidence(evidence);
        const uri = await pinEvidence(signed);
        const canonTx = await canon.anchorTickets({
            ticket_id_commit: body.ticketIdCommit,
            policy_commit: current.policyCommit,
            holder_tag: toTag,
            assurance: body.assurance ?? 1,
            uri,
            feeWei: CONFIG.FEE_WEI_TRANSFER
        });
        setState({
            ticketIdCommit: body.ticketIdCommit,
            holderTag: toTag,
            policyCommit: current.policyCommit,
            state: "TRANSFERRED",
            lastCanonTx: canonTx
        });
        return reply.send({ canonTx, newHolderTag: toTag });
    });
    // REVOKE
    app.post("/tickets/revoke", async (req, reply) => {
        const body = RevokeBody.parse(req.body);
        const current = getState(body.ticketIdCommit);
        if (!current)
            return reply.code(404).send({ error: "UNKNOWN_TICKET" });
        if (current.state === "REVOKED")
            return reply.code(200).send({ canonTx: current.lastCanonTx });
        const evidence = {
            version: "1.0",
            issuer: "did:venue:demo",
            event: { id: "<redacted>" },
            policy: { commit: current.policyCommit },
            operation: "REVOCATION",
            timestamp: nowISO(),
            extra: { reason: body.reason, ...(body.evidence ?? {}) }
        };
        const { signed } = await signEvidence(evidence);
        const uri = await pinEvidence(signed);
        const canonTx = await canon.anchorTickets({
            ticket_id_commit: body.ticketIdCommit,
            policy_commit: current.policyCommit,
            holder_tag: current.holderTag, // holder tag at time of revoke (optional)
            assurance: body.assurance ?? 1,
            uri,
            feeWei: CONFIG.FEE_WEI_REVOKE
        });
        setState({
            ticketIdCommit: body.ticketIdCommit,
            holderTag: current.holderTag,
            policyCommit: current.policyCommit,
            state: "REVOKED",
            lastCanonTx: canonTx
        });
        return reply.send({ canonTx, tombstoneUri: uri });
    });
    // VERIFY (gate)
    app.post("/tickets/verify", async (req, reply) => {
        const body = VerifyBody.parse(req.body);
        // Minimal QR payload parsing (your QR should contain ticketIdCommit and ephemeral session token)
        const [, ticketIdCommit] = body.ticketQrPayload.split(":").slice(-2); // e.g., "TICKET:<commit>"
        const s = getState(ticketIdCommit);
        if (!s)
            return reply.code(404).send({ decision: "DENY", reason: "UNKNOWN" });
        if (s.state === "REVOKED")
            return reply.send({ decision: "DENY", reason: "REVOKED", canonRef: s.lastCanonTx });
        // Holder proof (OTP/wallet sig) is app-specific; here you'd check that proof belongs to s.holderTag (omitted in stub).
        // If you keep a short-lived session binding, validate it here.
        return reply.send({ decision: "ALLOW", canonRef: s.lastCanonTx });
    });
}
