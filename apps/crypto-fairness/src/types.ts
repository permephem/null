import { Static, Type } from '@sinclair/typebox';

// Event Types
export const EventTypeEnum = Type.Enum({
  NFT_MINT: 'nft_mint',
  TOKEN_LAUNCH: 'token_launch',
  AIRDROP: 'airdrop',
  IDO: 'ido',
  AUCTION: 'auction'
});

export const ChainEnum = Type.Enum({
  ETHEREUM: 'ethereum',
  POLYGON: 'polygon',
  ARBITRUM: 'arbitrum',
  OPTIMISM: 'optimism',
  BASE: 'base',
  BSC: 'bsc'
});

export const ViolationTypeEnum = Type.Enum({
  BOT_CONCENTRATION: 'bot_concentration',
  MEV_FRONT_RUNNING: 'mev_front_running',
  SANDWICH_ATTACK: 'sandwich_attack',
  BACKDOOR_ALLOWLIST: 'backdoor_allowlist',
  PREMINED_SUPPLY: 'premined_supply',
  SYBIL_ATTACK: 'sybil_attack',
  TIMING_MANIPULATION: 'timing_manipulation',
  PRIVATE_RELAY_ABUSE: 'private_relay_abuse'
});

export const SeverityEnum = Type.Enum({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
});

export const FairnessScoreEnum = Type.Enum({
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor'
});

// Core Schemas
export const WalletClusterSchema = Type.Object({
  clusterId: Type.String(),
  walletAddresses: Type.Array(Type.String()),
  similarityScore: Type.Number({ minimum: 0, maximum: 1 }),
  behavioralSignals: Type.Array(Type.String()),
  firstSeen: Type.String({ format: 'date-time' }),
  lastSeen: Type.String({ format: 'date-time' })
});

export const ViolationSchema = Type.Object({
  violationId: Type.String(),
  type: ViolationTypeEnum,
  severity: SeverityEnum,
  description: Type.String(),
  evidence: Type.Object({
    mempoolTrace: Type.Optional(Type.String()),
    transactionHashes: Type.Array(Type.String()),
    walletAddresses: Type.Array(Type.String()),
    blockNumbers: Type.Array(Type.Number()),
    timestamp: Type.String({ format: 'date-time' })
  }),
  impact: Type.Object({
    affectedWallets: Type.Number(),
    affectedSupply: Type.Number(),
    estimatedLoss: Type.Optional(Type.String())
  }),
  confidence: Type.Number({ minimum: 0, maximum: 1 })
});

export const FairnessAnalysisSchema = Type.Object({
  eventId: Type.String(),
  eventType: EventTypeEnum,
  chain: ChainEnum,
  contractAddress: Type.String(),
  startBlock: Type.Number(),
  endBlock: Type.Number(),
  totalSupply: Type.String(),
  totalParticipants: Type.Number(),
  analysisTimestamp: Type.String({ format: 'date-time' }),
  overallScore: Type.Number({ minimum: 0, maximum: 100 }),
  scoreCategory: FairnessScoreEnum,
  violations: Type.Array(ViolationSchema),
  walletClusters: Type.Array(WalletClusterSchema),
  concentrationMetrics: Type.Object({
    giniCoefficient: Type.Number(),
    top10Percent: Type.Number(),
    top1Percent: Type.Number(),
    herfindahlIndex: Type.Number()
  }),
  mevMetrics: Type.Object({
    sandwichAttacks: Type.Number(),
    frontRunningTxs: Type.Number(),
    backRunningTxs: Type.Number(),
    privateRelayUsage: Type.Number()
  }),
  timingMetrics: Type.Object({
    averageConfirmationTime: Type.Number(),
    medianConfirmationTime: Type.Number(),
    fastestConfirmation: Type.Number(),
    slowestConfirmation: Type.Number()
  }),
  evidence: Type.Object({
    manifestHash: Type.String(),
    ipfsUri: Type.String(),
    reproducibleNotebook: Type.String(),
    rawDataHash: Type.String()
  })
});

export const ProbeRequestSchema = Type.Object({
  eventId: Type.String(),
  eventType: EventTypeEnum,
  chain: ChainEnum,
  contractAddress: Type.String(),
  startTime: Type.String({ format: 'date-time' }),
  endTime: Type.String({ format: 'date-time' }),
  probeConfig: Type.Object({
    mempoolMonitoring: Type.Boolean(),
    mevDetection: Type.Boolean(),
    botDetection: Type.Boolean(),
    timingAnalysis: Type.Boolean(),
    sampleSize: Type.Number({ minimum: 1, maximum: 1000 })
  })
});

export const AttestationSchema = Type.Object({
  attestationId: Type.String(),
  eventId: Type.String(),
  fairnessAnalysis: FairnessAnalysisSchema,
  attestorAddress: Type.String(),
  attestationTimestamp: Type.String({ format: 'date-time' }),
  signature: Type.String(),
  nullTokenPayment: Type.Object({
    amount: Type.String(),
    transactionHash: Type.String()
  }),
  canonEntry: Type.Object({
    seal: Type.String(),
    maskId: Type.String(),
    oblivionMarker: Type.String(),
    inscribedAt: Type.String({ format: 'date-time' })
  })
});

export const MempoolTransactionSchema = Type.Object({
  hash: Type.String(),
  from: Type.String(),
  to: Type.String(),
  value: Type.String(),
  gasPrice: Type.String(),
  gasLimit: Type.String(),
  nonce: Type.Number(),
  data: Type.String(),
  timestamp: Type.String({ format: 'date-time' }),
  mempoolArrivalTime: Type.String({ format: 'date-time' }),
  blockInclusionTime: Type.Optional(Type.String({ format: 'date-time' })),
  blockNumber: Type.Optional(Type.Number()),
  position: Type.Optional(Type.Number())
});

export const MEVPatternSchema = Type.Object({
  patternId: Type.String(),
  patternType: Type.Union([
    Type.Literal('sandwich'),
    Type.Literal('front_run'),
    Type.Literal('back_run'),
    Type.Literal('arbitrage'),
    Type.Literal('liquidation')
  ]),
  transactions: Type.Array(MempoolTransactionSchema),
  profit: Type.String(),
  gasUsed: Type.String(),
  blockNumber: Type.Number(),
  timestamp: Type.String({ format: 'date-time' }),
  confidence: Type.Number({ minimum: 0, maximum: 1 })
});

// Type Definitions
export type EventType = Static<typeof EventTypeEnum>;
export type Chain = Static<typeof ChainEnum>;
export type ViolationType = Static<typeof ViolationTypeEnum>;
export type Severity = Static<typeof SeverityEnum>;
export type FairnessScore = Static<typeof FairnessScoreEnum>;
export type WalletCluster = Static<typeof WalletClusterSchema>;
export type Violation = Static<typeof ViolationSchema>;
export type FairnessAnalysis = Static<typeof FairnessAnalysisSchema>;
export type ProbeRequest = Static<typeof ProbeRequestSchema>;
export type Attestation = Static<typeof AttestationSchema>;
export type MempoolTransaction = Static<typeof MempoolTransactionSchema>;
export type MEVPattern = Static<typeof MEVPatternSchema>;

// Additional Types
export interface ProbeConfig {
  geoDistribution: boolean;
  userAgents: string[];
  timeoutMs: number;
  retryAttempts: number;
  privateKeys: string[];
}

export interface EvidenceBundle {
  eventId: string;
  manifestHash: string;
  ipfsUri: string;
  artifacts: {
    mempoolTraces: string[];
    transactionReceipts: string[];
    blockData: string[];
    analysisNotebook: string;
    screenshots?: string[];
  };
  metadata: {
    createdAt: string;
    version: string;
    chain: Chain;
    blockRange: [number, number];
  };
}

export interface FairnessReport {
  eventId: string;
  publicUrl: string;
  methodology: string;
  keyFindings: string[];
  recommendations: string[];
  evidenceBundle: EvidenceBundle;
  pressKit: {
    summary: string;
    topViolations: Violation[];
    quotes: string[];
    dataDictionary: Record<string, string>;
  };
}

export interface EnterpriseDashboard {
  projectId: string;
  projectName: string;
  events: FairnessAnalysis[];
  overallScore: number;
  trendAnalysis: {
    period: string;
    scoreChange: number;
    violationTrend: Record<ViolationType, number>;
  };
  alerts: {
    type: string;
    severity: Severity;
    message: string;
    timestamp: string;
  }[];
}

export interface CertificationRequest {
  projectId: string;
  projectName: string;
  contractAddresses: string[];
  requestedEvents: EventType[];
  complianceRequirements: string[];
  contactEmail: string;
  estimatedCost: string;
  timeline: string;
}

export interface ProbeResult {
  probeId: string;
  eventId: string;
  success: boolean;
  data: any;
  errors: string[];
  timestamp: string;
  duration: number;
  nodeLocation: string;
}
