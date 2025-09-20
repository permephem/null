export const CONFIG = {
    PORT: Number(process.env.PORT ?? 8787),
    // Keep this server-side only; rotate periodically; persist old keys to resolve history.
    VENUE_HMAC_KEY: Buffer.from(process.env.VENUE_HMAC_KEY ?? "dev-key-DO-NOT-USE"),
    // EVM / Canon
    RPC_URL: process.env.RPC_URL ?? "http://localhost:8545",
    CANON_ADDRESS: process.env.CANON_ADDRESS ?? "0xCanonRegistryAddress",
    FOUNDATION_ADDRESS: process.env.FOUNDATION_ADDRESS ?? "0xFoundation",
    // Relayer signer private key (DO NOT commit)
    RELAYER_PK: process.env.RELAYER_PK ?? "0xdeadbeef",
    // Billing / fee policy (illustrative)
    FEE_WEI_ISSUE: BigInt(process.env.FEE_WEI_ISSUE ?? "0"),
    FEE_WEI_TRANSFER: BigInt(process.env.FEE_WEI_TRANSFER ?? "0"),
    FEE_WEI_REVOKE: BigInt(process.env.FEE_WEI_REVOKE ?? "0")
};
