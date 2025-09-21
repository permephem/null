import { ethers } from 'ethers';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { MempoolTransaction, MEVPattern, Chain } from './types';
import { cryptoFairnessConfig } from './config';

export class MempoolMonitor extends EventEmitter {
  private providers: Map<Chain, ethers.JsonRpcProvider> = new Map();
  private websockets: Map<Chain, WebSocket> = new Map();
  private mempoolTransactions: Map<string, MempoolTransaction> = new Map();
  private mevPatterns: MEVPattern[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeProviders();
  }

  private initializeProviders() {
    const { blockchain } = cryptoFairnessConfig;
    
    // Initialize providers for each chain
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

  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('Mempool monitoring already started');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting mempool monitoring...');

    // Start WebSocket connections for real-time mempool data
    for (const [chain, provider] of this.providers) {
      await this.startChainMonitoring(chain, provider);
    }

    // Start MEV detection
    if (cryptoFairnessConfig.monitoring.mevDetectionEnabled) {
      this.startMEVDetection();
    }

    // Start periodic cleanup
    this.startCleanup();

    console.log('Mempool monitoring started successfully');
  }

  private async startChainMonitoring(chain: Chain, provider: ethers.JsonRpcProvider) {
    try {
      // For now, we'll use polling since WebSocket mempool access is limited
      // In production, you'd want to use services like Alchemy's mempool API or run your own node
      this.monitoringInterval = setInterval(async () => {
        await this.pollMempool(chain, provider);
      }, cryptoFairnessConfig.monitoring.probeIntervalMs);

      console.log(`Started monitoring mempool for ${chain}`);
    } catch (error) {
      console.error(`Failed to start monitoring for ${chain}:`, error);
    }
  }

  private async pollMempool(chain: Chain, provider: ethers.JsonRpcProvider) {
    try {
      // Get pending transactions (this is a simplified approach)
      // In production, you'd want to use a proper mempool API
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber, true);
      
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (typeof tx === 'object' && tx.hash) {
            const mempoolTx: MempoolTransaction = {
              hash: tx.hash,
              from: tx.from,
              to: tx.to || '',
              value: tx.value.toString(),
              gasPrice: tx.gasPrice?.toString() || '0',
              gasLimit: tx.gasLimit.toString(),
              nonce: tx.nonce,
              data: tx.data,
              timestamp: new Date().toISOString(),
              mempoolArrivalTime: new Date().toISOString(),
              blockInclusionTime: new Date().toISOString(),
              blockNumber: blockNumber,
              position: block.transactions.indexOf(tx)
            };

            this.processMempoolTransaction(chain, mempoolTx);
          }
        }
      }
    } catch (error) {
      console.error(`Error polling mempool for ${chain}:`, error);
    }
  }

  private processMempoolTransaction(chain: Chain, tx: MempoolTransaction) {
    // Store transaction
    this.mempoolTransactions.set(tx.hash, tx);

    // Emit event for other components to process
    this.emit('mempoolTransaction', { chain, transaction: tx });

    // Check for MEV patterns
    if (cryptoFairnessConfig.monitoring.mevDetectionEnabled) {
      this.detectMEVPatterns(chain, tx);
    }

    // Clean up old transactions
    this.cleanupOldTransactions();
  }

  private detectMEVPatterns(chain: Chain, tx: MempoolTransaction) {
    // Detect sandwich attacks
    this.detectSandwichAttack(chain, tx);
    
    // Detect front-running
    this.detectFrontRunning(chain, tx);
    
    // Detect arbitrage opportunities
    this.detectArbitrage(chain, tx);
  }

  private detectSandwichAttack(chain: Chain, tx: MempoolTransaction) {
    // Simplified sandwich detection
    // In production, you'd want more sophisticated pattern matching
    const recentTxs = Array.from(this.mempoolTransactions.values())
      .filter(t => t.blockNumber === tx.blockNumber)
      .sort((a, b) => a.position! - b.position!);

    if (recentTxs.length >= 3) {
      // Look for sandwich pattern: user tx -> attacker buy -> user tx
      for (let i = 0; i < recentTxs.length - 2; i++) {
        const tx1 = recentTxs[i];
        const tx2 = recentTxs[i + 1];
        const tx3 = recentTxs[i + 2];

        if (this.isSandwichPattern(tx1, tx2, tx3)) {
          const pattern: MEVPattern = {
            patternId: `sandwich_${tx1.hash}_${tx2.hash}_${tx3.hash}`,
            patternType: 'sandwich',
            transactions: [tx1, tx2, tx3],
            profit: '0', // Calculate actual profit
            gasUsed: '0', // Calculate gas used
            blockNumber: tx.blockNumber!,
            timestamp: new Date().toISOString(),
            confidence: 0.8 // Calculate confidence score
          };

          this.mevPatterns.push(pattern);
          this.emit('mevPattern', { chain, pattern });
        }
      }
    }
  }

  private isSandwichPattern(tx1: MempoolTransaction, tx2: MempoolTransaction, tx3: MempoolTransaction): boolean {
    // Simplified sandwich detection logic
    // In production, you'd want to analyze:
    // - Same token pair
    // - Opposite directions (buy/sell)
    // - Similar amounts
    // - Same user address
    
    return (
      tx1.to === tx3.to && // Same target contract
      tx1.from !== tx2.from && // Different users
      tx2.from !== tx3.from &&
      tx1.position! < tx2.position! && // Correct ordering
      tx2.position! < tx3.position!
    );
  }

  private detectFrontRunning(chain: Chain, tx: MempoolTransaction) {
    // Detect front-running patterns
    // Look for transactions that appear to be copying or anticipating other transactions
    const recentTxs = Array.from(this.mempoolTransactions.values())
      .filter(t => t.blockNumber === tx.blockNumber && t.position! < tx.position!);

    for (const recentTx of recentTxs) {
      if (this.isFrontRunningPattern(recentTx, tx)) {
        const pattern: MEVPattern = {
          patternId: `frontrun_${recentTx.hash}_${tx.hash}`,
          patternType: 'front_run',
          transactions: [recentTx, tx],
          profit: '0',
          gasUsed: '0',
          blockNumber: tx.blockNumber!,
          timestamp: new Date().toISOString(),
          confidence: 0.7
        };

        this.mevPatterns.push(pattern);
        this.emit('mevPattern', { chain, pattern });
      }
    }
  }

  private isFrontRunningPattern(originalTx: MempoolTransaction, frontRunTx: MempoolTransaction): boolean {
    // Simplified front-running detection
    // In production, you'd analyze:
    // - Same target contract
    // - Similar transaction data
    // - Higher gas price
    // - Earlier position in block
    
    return (
      originalTx.to === frontRunTx.to &&
      originalTx.data === frontRunTx.data &&
      BigInt(frontRunTx.gasPrice) > BigInt(originalTx.gasPrice) &&
      frontRunTx.position! < originalTx.position!
    );
  }

  private detectArbitrage(chain: Chain, tx: MempoolTransaction) {
    // Detect arbitrage opportunities
    // Look for transactions that might be exploiting price differences
    // This is a simplified version - in production you'd analyze DEX prices
  }

  private startMEVDetection() {
    // Start MEV detection algorithms
    console.log('MEV detection started');
  }

  private startCleanup() {
    // Clean up old transactions and patterns
    setInterval(() => {
      this.cleanupOldTransactions();
      this.cleanupOldMEVPatterns();
    }, 60000); // Clean up every minute
  }

  private cleanupOldTransactions() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [hash, tx] of this.mempoolTransactions) {
      const txTime = new Date(tx.timestamp).getTime();
      if (now - txTime > maxAge) {
        this.mempoolTransactions.delete(hash);
      }
    }
  }

  private cleanupOldMEVPatterns() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    this.mevPatterns = this.mevPatterns.filter(pattern => {
      const patternTime = new Date(pattern.timestamp).getTime();
      return now - patternTime <= maxAge;
    });
  }

  async stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    // Close WebSocket connections
    for (const ws of this.websockets.values()) {
      ws.close();
    }
    this.websockets.clear();

    // Clear intervals
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('Mempool monitoring stopped');
  }

  getMempoolTransactions(chain?: Chain): MempoolTransaction[] {
    if (chain) {
      return Array.from(this.mempoolTransactions.values())
        .filter(tx => tx.blockNumber !== undefined);
    }
    return Array.from(this.mempoolTransactions.values());
  }

  getMEVPatterns(chain?: Chain): MEVPattern[] {
    if (chain) {
      return this.mevPatterns.filter(pattern => 
        pattern.transactions.some(tx => tx.blockNumber !== undefined)
      );
    }
    return this.mevPatterns;
  }

  getMempoolStats() {
    return {
      totalTransactions: this.mempoolTransactions.size,
      totalMEVPatterns: this.mevPatterns.length,
      chains: Array.from(this.providers.keys()),
      isMonitoring: this.isMonitoring
    };
  }
}
