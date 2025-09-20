import type { Hex, CanonAnchorPayload } from "./types.js";
import { Signer } from "ethers";
export declare class CanonClient {
    private foundation;
    private signer?;
    private contract;
    constructor(rpcProvider: any, // ethers Provider
    canonAddress: string, foundation: string, signer?: Signer | undefined);
    /**
     * Anchor a lifecycle event to Canon.
     * In production, this should be called by your relayer (server-side); clients sign typed data only.
     */
    anchor(payload: CanonAnchorPayload, msgValueWei?: bigint): Promise<Hex>;
}
