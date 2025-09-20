import type { CanonRegistry } from '../../../typechain-types';
export interface CanonServiceConfig {
    rpcUrl: string;
    privateKey: string;
    contractAddress: string;
}
export declare class CanonService {
    private provider;
    private wallet;
    private contract;
    constructor(config: CanonServiceConfig);
    getContract(): CanonRegistry;
    anchorWarrant(warrantHash: string, subjectHandleHash: string, enterpriseHash: string, enterpriseId: string, warrantId: string, _controllerDidHash: string, _subjectTag: string, _assurance: number): Promise<string>;
    getLastAnchorBlock(hash: string): Promise<number>;
    anchorAttestation(attestationHash: string, warrantHash: string, enterpriseHash: string, enterpriseId: string, attestationId: string, _controllerDidHash: string, _subjectTag: string, _assurance: number): Promise<{
        success: boolean;
        blockNumber?: number;
        error?: string;
    }>;
    isAnchored(hash: string): Promise<boolean>;
    warrantExists(warrantId: string): Promise<boolean>;
}
//# sourceMappingURL=CanonService.d.ts.map