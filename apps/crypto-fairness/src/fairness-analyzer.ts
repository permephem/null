import { ethers } from 'ethers';
import { 
  FairnessAnalysis, 
  Violation, 
  WalletCluster, 
  MempoolTransaction, 
  MEVPattern,
  EventType,
  Chain,
  ViolationType,
  Severity,
  FairnessScore
} from './types';
import { cryptoFairnessConfig } from './config';

export class FairnessAnalyzer {
  private providers: Map<Chain, ethers.JsonRpcProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    const { blockchain } = cryptoFairnessConfig;
    
    if (blockchain.ethereum.rpcUrl) {
      this.providers.set('ethereum', new ethers.JsonRpcProvider(blockchain.ethereum.rpcUrl));
    }
    if (blockchain.polygon.rpcUrl) {
      this.providers.set('polygon', new ethers.JsonRpcProvider(blockchain.polygon.rpcUrl));
    }
    if (blockchain.arbitrum.rpcUrl) {
      this.providers.set('arbitrum', new ethers.JsonRpcProvider(blockchain.arbitrum.rpcUrl));
    }
    if (blockchain.optimism.rpcUrl) {
      this.providers.set('optimism', new ethers.JsonRpcProvider(blockchain.optimism.rpcUrl));
    }
  }

  async analyzeEvent(
    eventId: string,
    eventType: EventType,
    chain: Chain,
    contractAddress: string,
    startBlock: number,
    endBlock: number,
    mempoolTransactions: MempoolTransaction[],
    mevPatterns: MEVPattern[]
  ): Promise<FairnessAnalysis> {
    console.log(`Analyzing event ${eventId} on ${chain}`);

    const provider = this.providers.get(chain);
    if (!provider) {
      throw new Error(`No provider available for chain ${chain}`);
    }

    // Get all transactions for the event
    const eventTransactions = await this.getEventTransactions(
      provider,
      contractAddress,
      startBlock,
      endBlock
    );

    // Analyze violations
    const violations = await this.detectViolations(
      eventTransactions,
      mempoolTransactions,
      mevPatterns,
      eventType
    );

    // Detect wallet clusters (bot detection)
    const walletClusters = this.detectWalletClusters(eventTransactions);

    // Calculate concentration metrics
    const concentrationMetrics = this.calculateConcentrationMetrics(eventTransactions);

    // Calculate MEV metrics
    const mevMetrics = this.calculateMEVMetrics(mevPatterns, startBlock, endBlock);

    // Calculate timing metrics
    const timingMetrics = this.calculateTimingMetrics(eventTransactions);

    // Calculate overall fairness score
    const overallScore = this.calculateOverallScore(
      violations,
      concentrationMetrics,
      mevMetrics,
      timingMetrics
    );

    const scoreCategory = this.getScoreCategory(overallScore);

    // Generate evidence bundle
    const evidence = await this.generateEvidenceBundle(
      eventId,
      eventTransactions,
      mempoolTransactions,
      mevPatterns,
      violations
    );

    const analysis: FairnessAnalysis = {
      eventId,
      eventType,
      chain,
      contractAddress,
      startBlock,
      endBlock,
      totalSupply: '0', // Will be calculated from contract
      totalParticipants: eventTransactions.length,
      analysisTimestamp: new Date().toISOString(),
      overallScore,
      scoreCategory,
      violations,
      walletClusters,
      concentrationMetrics,
      mevMetrics,
      timingMetrics,
      evidence
    };

    console.log(`Analysis complete for ${eventId}. Score: ${overallScore} (${scoreCategory})`);
    return analysis;
  }

  private async getEventTransactions(
    provider: ethers.JsonRpcProvider,
    contractAddress: string,
    startBlock: number,
    endBlock: number
  ): Promise<ethers.TransactionResponse[]> {
    const transactions: ethers.TransactionResponse[] = [];

    for (let blockNum = startBlock; blockNum <= endBlock; blockNum++) {
      try {
        const block = await provider.getBlock(blockNum, true);
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (typeof tx === 'object' && tx.to === contractAddress) {
              transactions.push(tx);
            }
          }
        }
      } catch (error) {
        console.error(`Error getting block ${blockNum}:`, error);
      }
    }

    return transactions;
  }

  private async detectViolations(
    eventTransactions: ethers.TransactionResponse[],
    mempoolTransactions: MempoolTransaction[],
    mevPatterns: MEVPattern[],
    eventType: EventType
  ): Promise<Violation[]> {
    const violations: Violation[] = [];

    // Detect bot concentration
    const botConcentrationViolation = this.detectBotConcentration(eventTransactions);
    if (botConcentrationViolation) {
      violations.push(botConcentrationViolation);
    }

    // Detect MEV violations
    const mevViolations = this.detectMEVViolations(mevPatterns, eventTransactions);
    violations.push(...mevViolations);

    // Detect timing manipulation
    const timingViolation = this.detectTimingManipulation(eventTransactions);
    if (timingViolation) {
      violations.push(timingViolation);
    }

    // Detect backdoor allowlists (for IDOs)
    if (eventType === 'ido' || eventType === 'token_launch') {
      const allowlistViolation = this.detectBackdoorAllowlist(eventTransactions);
      if (allowlistViolation) {
        violations.push(allowlistViolation);
      }
    }

    return violations;
  }

  private detectBotConcentration(transactions: ethers.TransactionResponse[]): Violation | null {
    // Analyze wallet addresses for bot-like behavior
    const walletCounts = new Map<string, number>();
    const walletNonces = new Map<string, number[]>();
    const walletGasPrices = new Map<string, string[]>();

    for (const tx of transactions) {
      const from = tx.from;
      walletCounts.set(from, (walletCounts.get(from) || 0) + 1);
      
      if (!walletNonces.has(from)) {
        walletNonces.set(from, []);
      }
      walletNonces.get(from)!.push(tx.nonce);
      
      if (!walletGasPrices.has(from)) {
        walletGasPrices.set(from, []);
      }
      walletGasPrices.get(from)!.push(tx.gasPrice?.toString() || '0');
    }

    // Detect suspicious patterns
    const suspiciousWallets: string[] = [];
    const totalWallets = walletCounts.size;
    const totalTransactions = transactions.length;

    for (const [wallet, count] of walletCounts) {
      const percentage = (count / totalTransactions) * 100;
      
      // Flag wallets with >5% of transactions or >10 transactions
      if (percentage > 5 || count > 10) {
        suspiciousWallets.push(wallet);
      }
    }

    if (suspiciousWallets.length > 0) {
      const topWallet = Array.from(walletCounts.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      const severity: Severity = topWallet[1] > totalTransactions * 0.1 ? 'high' : 'medium';
      
      return {
        violationId: `bot_concentration_${Date.now()}`,
        type: 'bot_concentration',
        severity,
        description: `Detected ${suspiciousWallets.length} wallets with suspicious transaction patterns. Top wallet has ${topWallet[1]} transactions (${((topWallet[1] / totalTransactions) * 100).toFixed(2)}%)`,
        evidence: {
          transactionHashes: transactions.map(tx => tx.hash),
          walletAddresses: suspiciousWallets,
          blockNumbers: transactions.map(tx => tx.blockNumber || 0),
          timestamp: new Date().toISOString()
        },
        impact: {
          affectedWallets: suspiciousWallets.length,
          affectedSupply: 0, // Will be calculated based on actual mint amounts
          estimatedLoss: '0'
        },
        confidence: 0.8
      };
    }

    return null;
  }

  private detectMEVViolations(
    mevPatterns: MEVPattern[],
    eventTransactions: ethers.TransactionResponse[]
  ): Violation[] {
    const violations: Violation[] = [];

    for (const pattern of mevPatterns) {
      if (pattern.patternType === 'sandwich') {
        violations.push({
          violationId: `sandwich_${pattern.patternId}`,
          type: 'sandwich_attack',
          severity: 'high',
          description: `Detected sandwich attack with ${pattern.transactions.length} transactions`,
          evidence: {
            transactionHashes: pattern.transactions.map(tx => tx.hash),
            walletAddresses: pattern.transactions.map(tx => tx.from),
            blockNumbers: [pattern.blockNumber],
            timestamp: pattern.timestamp
          },
          impact: {
            affectedWallets: 1,
            affectedSupply: 0,
            estimatedLoss: pattern.profit
          },
          confidence: pattern.confidence
        });
      } else if (pattern.patternType === 'front_run') {
        violations.push({
          violationId: `frontrun_${pattern.patternId}`,
          type: 'mev_front_running',
          severity: 'medium',
          description: `Detected front-running attack`,
          evidence: {
            transactionHashes: pattern.transactions.map(tx => tx.hash),
            walletAddresses: pattern.transactions.map(tx => tx.from),
            blockNumbers: [pattern.blockNumber],
            timestamp: pattern.timestamp
          },
          impact: {
            affectedWallets: 1,
            affectedSupply: 0,
            estimatedLoss: pattern.profit
          },
          confidence: pattern.confidence
        });
      }
    }

    return violations;
  }

  private detectTimingManipulation(transactions: ethers.TransactionResponse[]): Violation | null {
    // Analyze transaction timing patterns
    const timestamps = transactions
      .map(tx => tx.timestamp || 0)
      .sort((a, b) => a - b);

    if (timestamps.length < 10) {
      return null; // Not enough data
    }

    // Check for suspicious timing patterns
    const timeDiffs = [];
    for (let i = 1; i < timestamps.length; i++) {
      timeDiffs.push(timestamps[i] - timestamps[i - 1]);
    }

    // Look for very short intervals (possible bot coordination)
    const shortIntervals = timeDiffs.filter(diff => diff < 1); // Less than 1 second
    
    if (shortIntervals.length > timestamps.length * 0.3) {
      return {
        violationId: `timing_manipulation_${Date.now()}`,
        type: 'timing_manipulation',
        severity: 'medium',
        description: `Detected suspicious timing patterns with ${shortIntervals.length} transactions within 1 second of each other`,
        evidence: {
          transactionHashes: transactions.map(tx => tx.hash),
          walletAddresses: transactions.map(tx => tx.from),
          blockNumbers: transactions.map(tx => tx.blockNumber || 0),
          timestamp: new Date().toISOString()
        },
        impact: {
          affectedWallets: transactions.length,
          affectedSupply: 0,
          estimatedLoss: '0'
        },
        confidence: 0.7
      };
    }

    return null;
  }

  private detectBackdoorAllowlist(transactions: ethers.TransactionResponse[]): Violation | null {
    // This would require analyzing the contract's allowlist logic
    // For now, we'll implement a simplified version
    return null;
  }

  private detectWalletClusters(transactions: ethers.TransactionResponse[]): WalletCluster[] {
    const clusters: WalletCluster[] = [];
    const walletGroups = new Map<string, string[]>();

    // Group wallets by similar behavior patterns
    for (const tx of transactions) {
      const from = tx.from;
      const nonce = tx.nonce;
      const gasPrice = tx.gasPrice?.toString() || '0';

      // Simple clustering based on nonce patterns and gas prices
      const key = `${nonce}_${gasPrice}`;
      if (!walletGroups.has(key)) {
        walletGroups.set(key, []);
      }
      walletGroups.get(key)!.push(from);
    }

    // Create clusters for groups with multiple wallets
    for (const [key, wallets] of walletGroups) {
      if (wallets.length > 1) {
        const uniqueWallets = [...new Set(wallets)];
        if (uniqueWallets.length > 1) {
          clusters.push({
            clusterId: `cluster_${key}_${Date.now()}`,
            walletAddresses: uniqueWallets,
            similarityScore: 0.8, // Calculate based on actual similarity
            behavioralSignals: ['similar_nonce', 'similar_gas_price'],
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString()
          });
        }
      }
    }

    return clusters;
  }

  private calculateConcentrationMetrics(transactions: ethers.TransactionResponse[]) {
    const walletCounts = new Map<string, number>();
    
    for (const tx of transactions) {
      const from = tx.from;
      walletCounts.set(from, (walletCounts.get(from) || 0) + 1);
    }

    const counts = Array.from(walletCounts.values()).sort((a, b) => b - a);
    const total = counts.reduce((sum, count) => sum + count, 0);

    // Calculate Gini coefficient
    const giniCoefficient = this.calculateGiniCoefficient(counts);

    // Calculate top percentiles
    const top10Percent = this.calculateTopPercentile(counts, 0.1);
    const top1Percent = this.calculateTopPercentile(counts, 0.01);

    // Calculate Herfindahl index
    const herfindahlIndex = this.calculateHerfindahlIndex(counts, total);

    return {
      giniCoefficient,
      top10Percent,
      top1Percent,
      herfindahlIndex
    };
  }

  private calculateGiniCoefficient(counts: number[]): number {
    if (counts.length === 0) return 0;

    const sorted = [...counts].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    let gini = 0;
    for (let i = 0; i < n; i++) {
      gini += (2 * (i + 1) - n - 1) * sorted[i];
    }
    
    return gini / (n * sum);
  }

  private calculateTopPercentile(counts: number[], percentile: number): number {
    const sorted = [...counts].sort((a, b) => b - a);
    const index = Math.floor(sorted.length * percentile);
    const topCounts = sorted.slice(0, index);
    const total = counts.reduce((sum, count) => sum + count, 0);
    const topTotal = topCounts.reduce((sum, count) => sum + count, 0);
    
    return total > 0 ? (topTotal / total) * 100 : 0;
  }

  private calculateHerfindahlIndex(counts: number[], total: number): number {
    if (total === 0) return 0;
    
    let hhi = 0;
    for (const count of counts) {
      const share = count / total;
      hhi += share * share;
    }
    
    return hhi;
  }

  private calculateMEVMetrics(mevPatterns: MEVPattern[], startBlock: number, endBlock: number) {
    const relevantPatterns = mevPatterns.filter(
      pattern => pattern.blockNumber >= startBlock && pattern.blockNumber <= endBlock
    );

    return {
      sandwichAttacks: relevantPatterns.filter(p => p.patternType === 'sandwich').length,
      frontRunningTxs: relevantPatterns.filter(p => p.patternType === 'front_run').length,
      backRunningTxs: relevantPatterns.filter(p => p.patternType === 'back_run').length,
      privateRelayUsage: 0 // Would need additional data
    };
  }

  private calculateTimingMetrics(transactions: ethers.TransactionResponse[]) {
    const timestamps = transactions
      .map(tx => tx.timestamp || 0)
      .filter(ts => ts > 0)
      .sort((a, b) => a - b);

    if (timestamps.length === 0) {
      return {
        averageConfirmationTime: 0,
        medianConfirmationTime: 0,
        fastestConfirmation: 0,
        slowestConfirmation: 0
      };
    }

    const timeDiffs = [];
    for (let i = 1; i < timestamps.length; i++) {
      timeDiffs.push(timestamps[i] - timestamps[i - 1]);
    }

    return {
      averageConfirmationTime: timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length,
      medianConfirmationTime: timeDiffs[Math.floor(timeDiffs.length / 2)],
      fastestConfirmation: Math.min(...timeDiffs),
      slowestConfirmation: Math.max(...timeDiffs)
    };
  }

  private calculateOverallScore(
    violations: Violation[],
    concentrationMetrics: any,
    mevMetrics: any,
    timingMetrics: any
  ): number {
    const { weights } = cryptoFairnessConfig.fairness;
    
    // Start with perfect score
    let score = 100;

    // Deduct points for violations
    for (const violation of violations) {
      const severityMultiplier = {
        low: 5,
        medium: 10,
        high: 20,
        critical: 30
      }[violation.severity];
      
      score -= severityMultiplier * violation.confidence;
    }

    // Deduct points for concentration
    if (concentrationMetrics.giniCoefficient > 0.7) {
      score -= 15;
    } else if (concentrationMetrics.giniCoefficient > 0.5) {
      score -= 10;
    }

    // Deduct points for MEV
    if (mevMetrics.sandwichAttacks > 0) {
      score -= 20;
    }
    if (mevMetrics.frontRunningTxs > 0) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private getScoreCategory(score: number): FairnessScore {
    const { thresholds } = cryptoFairnessConfig.fairness;
    
    if (score >= thresholds.excellent) return 'excellent';
    if (score >= thresholds.good) return 'good';
    if (score >= thresholds.fair) return 'fair';
    return 'poor';
  }

  private async generateEvidenceBundle(
    eventId: string,
    eventTransactions: ethers.TransactionResponse[],
    mempoolTransactions: MempoolTransaction[],
    mevPatterns: MEVPattern[],
    violations: Violation[]
  ) {
    // Generate manifest hash
    const manifestData = {
      eventId,
      timestamp: new Date().toISOString(),
      transactionCount: eventTransactions.length,
      violationCount: violations.length,
      mevPatternCount: mevPatterns.length
    };
    
    const manifestHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(manifestData)));

    // In production, you'd upload to IPFS and get the URI
    const ipfsUri = `ipfs://${manifestHash}`;
    const reproducibleNotebook = `ipfs://notebook_${manifestHash}`;
    const rawDataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
      transactions: eventTransactions,
      mempool: mempoolTransactions,
      mev: mevPatterns
    })));

    return {
      manifestHash,
      ipfsUri,
      reproducibleNotebook,
      rawDataHash
    };
  }
}
