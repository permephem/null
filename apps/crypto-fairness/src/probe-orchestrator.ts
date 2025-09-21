import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { 
  ProbeRequest, 
  ProbeResult, 
  Chain, 
  EventType,
  MempoolTransaction,
  MEVPattern
} from './types';
import { cryptoFairnessConfig } from './config';
import { MempoolMonitor } from './mempool-monitor';
import { FairnessAnalyzer } from './fairness-analyzer';

export class ProbeOrchestrator extends EventEmitter {
  private mempoolMonitor: MempoolMonitor;
  private fairnessAnalyzer: FairnessAnalyzer;
  private activeProbes: Map<string, ProbeRequest> = new Map();
  private probeResults: Map<string, ProbeResult> = new Map();
  private providers: Map<Chain, ethers.JsonRpcProvider> = new Map();
  private wallets: Map<string, ethers.Wallet> = new Map();

  constructor() {
    super();
    this.mempoolMonitor = new MempoolMonitor();
    this.fairnessAnalyzer = new FairnessAnalyzer();
    this.initializeProviders();
    this.initializeWallets();
    this.setupEventListeners();
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

  private initializeWallets() {
    const { probe } = cryptoFairnessConfig;
    
    for (const privateKey of probe.privateKeys) {
      try {
        const wallet = new ethers.Wallet(privateKey);
        this.wallets.set(wallet.address, wallet);
      } catch (error) {
        console.error('Invalid private key:', error);
      }
    }
  }

  private setupEventListeners() {
    this.mempoolMonitor.on('mempoolTransaction', (data) => {
      this.emit('mempoolTransaction', data);
    });

    this.mempoolMonitor.on('mevPattern', (data) => {
      this.emit('mevPattern', data);
    });
  }

  async start() {
    console.log('Starting Probe Orchestrator...');
    
    // Start mempool monitoring
    await this.mempoolMonitor.startMonitoring();
    
    console.log('Probe Orchestrator started successfully');
  }

  async stop() {
    console.log('Stopping Probe Orchestrator...');
    
    // Stop mempool monitoring
    await this.mempoolMonitor.stopMonitoring();
    
    console.log('Probe Orchestrator stopped');
  }

  async createProbe(probeRequest: ProbeRequest): Promise<string> {
    const probeId = `probe_${probeRequest.eventId}_${Date.now()}`;
    
    console.log(`Creating probe ${probeId} for event ${probeRequest.eventId}`);
    
    // Store the probe request
    this.activeProbes.set(probeId, probeRequest);
    
    // Start the probe
    this.executeProbe(probeId, probeRequest);
    
    return probeId;
  }

  private async executeProbe(probeId: string, probeRequest: ProbeRequest) {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      console.log(`Executing probe ${probeId}`);
      
      // Get provider for the chain
      const provider = this.providers.get(probeRequest.chain);
      if (!provider) {
        throw new Error(`No provider available for chain ${probeRequest.chain}`);
      }

      // Get current block number
      const currentBlock = await provider.getBlockNumber();
      
      // Determine start and end blocks
      const startBlock = probeRequest.startTime ? 
        await this.getBlockByTimestamp(provider, probeRequest.startTime) : 
        currentBlock - 100; // Default to last 100 blocks
        
      const endBlock = probeRequest.endTime ? 
        await this.getBlockByTimestamp(provider, probeRequest.endTime) : 
        currentBlock;

      // Collect mempool data
      const mempoolTransactions = this.mempoolMonitor.getMempoolTransactions(probeRequest.chain);
      const mevPatterns = this.mempoolMonitor.getMEVPatterns(probeRequest.chain);

      // Send test transactions if configured
      let testTransactionResults = [];
      if (probeRequest.probeConfig.mempoolMonitoring) {
        testTransactionResults = await this.sendTestTransactions(
          provider,
          probeRequest.contractAddress,
          probeRequest.chain
        );
      }

      // Perform fairness analysis
      const fairnessAnalysis = await this.fairnessAnalyzer.analyzeEvent(
        probeRequest.eventId,
        probeRequest.eventType,
        probeRequest.chain,
        probeRequest.contractAddress,
        startBlock,
        endBlock,
        mempoolTransactions,
        mevPatterns
      );

      // Create probe result
      const probeResult: ProbeResult = {
        probeId,
        eventId: probeRequest.eventId,
        success: true,
        data: {
          fairnessAnalysis,
          testTransactions: testTransactionResults,
          mempoolData: {
            transactionCount: mempoolTransactions.length,
            mevPatternCount: mevPatterns.length
          },
          blockRange: [startBlock, endBlock]
        },
        errors,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        nodeLocation: 'us-east-1' // Would be dynamic in production
      };

      this.probeResults.set(probeId, probeResult);
      this.emit('probeComplete', probeResult);

    } catch (error) {
      console.error(`Probe ${probeId} failed:`, error);
      
      const probeResult: ProbeResult = {
        probeId,
        eventId: probeRequest.eventId,
        success: false,
        data: null,
        errors: [error instanceof Error ? error.message : String(error)],
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        nodeLocation: 'us-east-1'
      };

      this.probeResults.set(probeId, probeResult);
      this.emit('probeFailed', probeResult);
    }
  }

  private async getBlockByTimestamp(provider: ethers.JsonRpcProvider, timestamp: string): Promise<number> {
    // This is a simplified implementation
    // In production, you'd want to use a more efficient method
    const targetTime = Math.floor(new Date(timestamp).getTime() / 1000);
    const currentBlock = await provider.getBlockNumber();
    
    // Binary search for the block with timestamp closest to target
    let low = 0;
    let high = currentBlock;
    let closestBlock = currentBlock;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      try {
        const block = await provider.getBlock(mid);
        if (block) {
          const blockTime = block.timestamp;
          if (blockTime <= targetTime) {
            closestBlock = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        } else {
          high = mid - 1;
        }
      } catch (error) {
        high = mid - 1;
      }
    }
    
    return closestBlock;
  }

  private async sendTestTransactions(
    provider: ethers.JsonRpcProvider,
    contractAddress: string,
    chain: Chain
  ): Promise<any[]> {
    const results = [];
    const { probe } = cryptoFairnessConfig;
    
    // Select a random wallet for testing
    const walletAddresses = Array.from(this.wallets.keys());
    if (walletAddresses.length === 0) {
      console.warn('No wallets available for test transactions');
      return results;
    }
    
    const walletAddress = walletAddresses[Math.floor(Math.random() * walletAddresses.length)];
    const wallet = this.wallets.get(walletAddress)!;
    const connectedWallet = wallet.connect(provider);
    
    try {
      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      
      // Create a test transaction (this would be customized based on the contract)
      const testTx = {
        to: contractAddress,
        value: 0,
        gasLimit: 100000,
        gasPrice: gasPrice,
        data: '0x' // Empty data for now
      };
      
      // Send the transaction
      const txResponse = await connectedWallet.sendTransaction(testTx);
      console.log(`Sent test transaction: ${txResponse.hash}`);
      
      // Wait for confirmation (optional, for faster execution)
      // const receipt = await txResponse.wait();
      
      results.push({
        transactionHash: txResponse.hash,
        from: walletAddress,
        to: contractAddress,
        gasPrice: gasPrice.toString(),
        timestamp: new Date().toISOString(),
        status: 'sent'
      });
      
    } catch (error) {
      console.error('Failed to send test transaction:', error);
      results.push({
        from: walletAddress,
        to: contractAddress,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return results;
  }

  getProbeStatus(probeId: string): ProbeResult | null {
    return this.probeResults.get(probeId) || null;
  }

  getActiveProbes(): ProbeRequest[] {
    return Array.from(this.activeProbes.values());
  }

  getProbeResults(): ProbeResult[] {
    return Array.from(this.probeResults.values());
  }

  getMempoolStats() {
    return this.mempoolMonitor.getMempoolStats();
  }

  // Method to simulate distributed probe execution
  async executeDistributedProbe(probeRequest: ProbeRequest): Promise<ProbeResult[]> {
    const results: ProbeResult[] = [];
    
    // In production, this would coordinate with multiple probe nodes
    // For now, we'll simulate with multiple local executions
    const probeCount = Math.min(3, cryptoFairnessConfig.probe.privateKeys.length);
    
    for (let i = 0; i < probeCount; i++) {
      const probeId = `distributed_${probeRequest.eventId}_${i}_${Date.now()}`;
      this.activeProbes.set(probeId, probeRequest);
      
      // Execute probe with slight delay to simulate distributed execution
      setTimeout(() => {
        this.executeProbe(probeId, probeRequest);
      }, i * 1000);
    }
    
    // Wait for all probes to complete
    return new Promise((resolve) => {
      const checkResults = () => {
        const completedResults = Array.from(this.probeResults.values())
          .filter(result => result.eventId === probeRequest.eventId);
        
        if (completedResults.length >= probeCount) {
          resolve(completedResults);
        } else {
          setTimeout(checkResults, 1000);
        }
      };
      
      checkResults();
    });
  }

  // Method to aggregate results from multiple probe nodes
  aggregateProbeResults(results: ProbeResult[]): any {
    if (results.length === 0) {
      return null;
    }
    
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length === 0) {
      return {
        success: false,
        error: 'All probe attempts failed',
        results: results
      };
    }
    
    // Aggregate fairness analyses
    const analyses = successfulResults
      .map(r => r.data?.fairnessAnalysis)
      .filter(Boolean);
    
    if (analyses.length === 0) {
      return {
        success: false,
        error: 'No successful analyses',
        results: results
      };
    }
    
    // Calculate average scores
    const avgScore = analyses.reduce((sum, analysis) => sum + analysis.overallScore, 0) / analyses.length;
    
    // Combine violations
    const allViolations = analyses.flatMap(analysis => analysis.violations);
    const uniqueViolations = this.deduplicateViolations(allViolations);
    
    // Combine wallet clusters
    const allClusters = analyses.flatMap(analysis => analysis.walletClusters);
    const uniqueClusters = this.deduplicateClusters(allClusters);
    
    return {
      success: true,
      aggregatedAnalysis: {
        averageScore: avgScore,
        scoreCategory: this.getScoreCategory(avgScore),
        violations: uniqueViolations,
        walletClusters: uniqueClusters,
        probeCount: successfulResults.length,
        consensus: this.calculateConsensus(analyses)
      },
      individualResults: results
    };
  }

  private deduplicateViolations(violations: any[]): any[] {
    const seen = new Set();
    return violations.filter(violation => {
      const key = `${violation.type}_${violation.evidence.transactionHashes.join('_')}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private deduplicateClusters(clusters: any[]): any[] {
    const seen = new Set();
    return clusters.filter(cluster => {
      const key = cluster.walletAddresses.sort().join('_');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private calculateConsensus(analyses: any[]): number {
    if (analyses.length <= 1) return 1.0;
    
    const scores = analyses.map(a => a.overallScore);
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Higher consensus = lower standard deviation
    return Math.max(0, 1 - (stdDev / 100));
  }

  private getScoreCategory(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }
}
