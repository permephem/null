export interface SBTServiceConfig {
    rpcUrl: string;
    privateKey: string;
    contractAddress: string;
}
export declare class SBTService {
    private provider;
    private wallet;
    private contract;
    constructor(config: SBTServiceConfig);
    mintReceipt(to: string, receiptHash: string): Promise<string>;
    isMintingEnabled(): Promise<boolean>;
    setMintingEnabled(enabled: boolean): Promise<string>;
}
//# sourceMappingURL=SBTService.d.ts.map