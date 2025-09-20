import { z } from "zod";
export const TicketPolicy = z.object({
    maxResalePct: z.number().int().positive().optional(),
    transferWindowHours: z.number().int().positive().optional(),
    kycLevel: z.enum(["none", "light", "full"]).optional(),
    resaleOnlyVia: z.array(z.string()).optional()
});
export const IssueBody = z.object({
    eventId: z.string().min(1),
    seat: z.string().min(1),
    holderIdentifier: z.string().min(1),
    policy: TicketPolicy,
    assurance: z.number().int().min(0).max(3).optional(),
    evidence: z.record(z.any()).optional()
});
export const TransferBody = z.object({
    ticketIdCommit: z.string().min(3),
    fromIdentifier: z.string().min(1),
    toIdentifier: z.string().min(1),
    assurance: z.number().int().min(0).max(3).optional(),
    evidence: z.record(z.any()).optional()
});
export const RevokeBody = z.object({
    ticketIdCommit: z.string().min(3),
    reason: z.enum(["policy_breach", "fraud", "chargeback", "refund_cancelled", "lost_stolen"]),
    assurance: z.number().int().min(0).max(3).optional(),
    evidence: z.record(z.any()).optional()
});
export const VerifyBody = z.object({
    ticketQrPayload: z.string().min(1),
    holderProof: z.string().min(1)
});
