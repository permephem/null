import type { SdkConfig, IssueRequest, IssueResponse, TransferRequest, TransferResponse, RevokeRequest, RevokeResponse, VerifyRequest, VerifyResult } from "./types.js";
export declare class NullTicketsClient {
    private cfg;
    constructor(cfg: SdkConfig);
    /** Primary sale → issue ticket + Canon ISSUANCE anchor (server-side relayer recommended). */
    issue(req: IssueRequest): Promise<IssueResponse>;
    /** Approved exchange transfer → Canon TRANSFER anchor. */
    transfer(req: TransferRequest): Promise<TransferResponse>;
    /** Policy breach/fraud → Canon REVOCATION anchor (Null Warrant). */
    revoke(req: RevokeRequest): Promise<RevokeResponse>;
    /** Gate verification (online). Use offline snapshot as fallback in the scanner app. */
    verifyAtGate(req: VerifyRequest): Promise<VerifyResult>;
}
