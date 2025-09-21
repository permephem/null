import { config } from 'dotenv';

// Load environment variables
config();

export interface CryptoFairnessConfig {
  server: {
    port: number;
    host: string;
    nodeEnv: string;
  };
  blockchain: {
    ethereum: {
      rpcUrl: string;
      chainId: number;
    };
    polygon: {
      rpcUrl: string;
      chainId: number;
    };
    arbitrum: {
      rpcUrl: string;
      chainId: number;
    };
    optimism: {
      rpcUrl: string;
      chainId: number;
    };
  };
  nullProtocol: {
    nullTokenAddress: string;
    canonRegistryAddress: string;
    fairnessRegistryAddress: string;
  };
  ipfs: {
    gatewayUrl: string;
    apiUrl: string;
    projectId?: string;
    projectSecret?: string;
  };
  redis: {
    url: string;
    password?: string;
  };
  database: {
    url: string;
  };
  monitoring: {
    mempoolMonitoringEnabled: boolean;
    mevDetectionEnabled: boolean;
    probeIntervalMs: number;
    maxConcurrentProbes: number;
  };
  apiKeys: {
    alchemy: string;
    infura: string;
    flashbots?: string;
  };
  security: {
    apiKeySecret: string;
    jwtSecret: string;
  };
  logging: {
    level: string;
    format: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  probe: {
    geoDistribution: boolean;
    userAgents: string[];
    timeoutMs: number;
    retryAttempts: number;
    privateKeys: string[];
  };
  evidence: {
    retentionDays: number;
    compression: boolean;
    encryption: boolean;
  };
  fairness: {
    weights: {
      concentration: number;
      mev: number;
      botDetection: number;
      timing: number;
    };
    thresholds: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
  };
  notifications: {
    slackWebhookUrl?: string;
    discordWebhookUrl?: string;
    email: {
      smtpHost?: string;
      smtpPort: number;
      username?: string;
      password?: string;
    };
  };
  enterprise: {
    mode: boolean;
    apiKey?: string;
    webhookUrl?: string;
  };
}

const parseWeights = (weightsStr: string) => {
  try {
    return JSON.parse(weightsStr);
  } catch {
    return {
      concentration: 0.4,
      mev: 0.3,
      botDetection: 0.2,
      timing: 0.1
    };
  }
};

const parseThresholds = (thresholdsStr: string) => {
  try {
    return JSON.parse(thresholdsStr);
  } catch {
    return {
      excellent: 90,
      good: 75,
      fair: 60,
      poor: 40
    };
  }
};

export const cryptoFairnessConfig: CryptoFairnessConfig = {
  server: {
    port: parseInt(process.env.PORT || '8787'),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  blockchain: {
    ethereum: {
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      chainId: 1
    },
    polygon: {
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      chainId: 137
    },
    arbitrum: {
      rpcUrl: process.env.ARBITRUM_RPC_URL || '',
      chainId: 42161
    },
    optimism: {
      rpcUrl: process.env.OPTIMISM_RPC_URL || '',
      chainId: 10
    }
  },
  nullProtocol: {
    nullTokenAddress: process.env.NULL_TOKEN_ADDRESS || '',
    canonRegistryAddress: process.env.CANON_REGISTRY_ADDRESS || '',
    fairnessRegistryAddress: process.env.FAIRNESS_REGISTRY_ADDRESS || ''
  },
  ipfs: {
    gatewayUrl: process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/',
    apiUrl: process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001',
    projectId: process.env.IPFS_PROJECT_ID,
    projectSecret: process.env.IPFS_PROJECT_SECRET
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/crypto_fairness'
  },
  monitoring: {
    mempoolMonitoringEnabled: process.env.MEMPOOL_MONITORING_ENABLED === 'true',
    mevDetectionEnabled: process.env.MEV_DETECTION_ENABLED === 'true',
    probeIntervalMs: parseInt(process.env.PROBE_INTERVAL_MS || '5000'),
    maxConcurrentProbes: parseInt(process.env.MAX_CONCURRENT_PROBES || '10')
  },
  apiKeys: {
    alchemy: process.env.ALCHEMY_API_KEY || '',
    infura: process.env.INFURA_API_KEY || '',
    flashbots: process.env.FLASHBOTS_API_KEY
  },
  security: {
    apiKeySecret: process.env.API_KEY_SECRET || 'default-secret',
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },
  probe: {
    geoDistribution: process.env.PROBE_GEO_DISTRIBUTION === 'true',
    userAgents: (process.env.PROBE_USER_AGENTS || 'chrome,firefox,safari').split(','),
    timeoutMs: parseInt(process.env.PROBE_TIMEOUT_MS || '30000'),
    retryAttempts: parseInt(process.env.PROBE_RETRY_ATTEMPTS || '3'),
    privateKeys: [
      process.env.PROBE_PRIVATE_KEY_1,
      process.env.PROBE_PRIVATE_KEY_2,
      process.env.PROBE_PRIVATE_KEY_3
    ].filter(Boolean) as string[]
  },
  evidence: {
    retentionDays: parseInt(process.env.EVIDENCE_RETENTION_DAYS || '365'),
    compression: process.env.EVIDENCE_COMPRESSION === 'true',
    encryption: process.env.EVIDENCE_ENCRYPTION === 'true'
  },
  fairness: {
    weights: parseWeights(process.env.FAIRNESS_WEIGHTS || '{}'),
    thresholds: parseThresholds(process.env.FAIRNESS_THRESHOLDS || '{}')
  },
  notifications: {
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
    email: {
      smtpHost: process.env.EMAIL_SMTP_HOST,
      smtpPort: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
      username: process.env.EMAIL_USERNAME,
      password: process.env.EMAIL_PASSWORD
    }
  },
  enterprise: {
    mode: process.env.ENTERPRISE_MODE === 'true',
    apiKey: process.env.ENTERPRISE_API_KEY,
    webhookUrl: process.env.ENTERPRISE_WEBHOOK_URL
  }
};

export default cryptoFairnessConfig;
