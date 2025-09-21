#!/usr/bin/env node

import { cryptoFairnessConfig } from './config';
import { ProbeOrchestrator } from './probe-orchestrator';
import { MempoolMonitor } from './mempool-monitor';
import { FairnessAnalyzer } from './fairness-analyzer';

/**
 * Null Protocol Crypto Fairness Relayer
 * 
 * Distributed monitoring system for crypto fairness in:
 * - NFT mints
 * - Token launches
 * - Airdrops
 * - IDOs
 * - Auctions
 * 
 * Features:
 * - Real-time mempool monitoring
 * - MEV detection
 * - Bot detection
 * - Fairness scoring
 * - Evidence collection
 * - Attestation generation
 */

async function main() {
  console.log('🚀 Starting Null Protocol Crypto Fairness Relayer...');
  console.log(`Environment: ${cryptoFairnessConfig.server.nodeEnv}`);
  console.log(`Port: ${cryptoFairnessConfig.server.port}`);
  
  try {
    // Initialize services
    const probeOrchestrator = new ProbeOrchestrator();
    const mempoolMonitor = new MempoolMonitor();
    const fairnessAnalyzer = new FairnessAnalyzer();
    
    // Start services
    console.log('📡 Starting mempool monitoring...');
    await mempoolMonitor.startMonitoring();
    
    console.log('🔍 Starting probe orchestrator...');
    await probeOrchestrator.start();
    
    console.log('✅ All services started successfully');
    
    // Log configuration
    console.log('\n📋 Configuration:');
    console.log(`- Mempool monitoring: ${cryptoFairnessConfig.monitoring.mempoolMonitoringEnabled ? 'enabled' : 'disabled'}`);
    console.log(`- MEV detection: ${cryptoFairnessConfig.monitoring.mevDetectionEnabled ? 'enabled' : 'disabled'}`);
    console.log(`- Probe interval: ${cryptoFairnessConfig.monitoring.probeIntervalMs}ms`);
    console.log(`- Max concurrent probes: ${cryptoFairnessConfig.monitoring.maxConcurrentProbes}`);
    console.log(`- Probe wallets: ${cryptoFairnessConfig.probe.privateKeys.length}`);
    
    // Log supported chains
    const supportedChains = [];
    if (cryptoFairnessConfig.blockchain.ethereum.rpcUrl) supportedChains.push('Ethereum');
    if (cryptoFairnessConfig.blockchain.polygon.rpcUrl) supportedChains.push('Polygon');
    if (cryptoFairnessConfig.blockchain.arbitrum.rpcUrl) supportedChains.push('Arbitrum');
    if (cryptoFairnessConfig.blockchain.optimism.rpcUrl) supportedChains.push('Optimism');
    
    console.log(`- Supported chains: ${supportedChains.join(', ')}`);
    
    // Log fairness configuration
    console.log('\n⚖️ Fairness Configuration:');
    console.log(`- Concentration weight: ${cryptoFairnessConfig.fairness.weights.concentration}`);
    console.log(`- MEV weight: ${cryptoFairnessConfig.fairness.weights.mev}`);
    console.log(`- Bot detection weight: ${cryptoFairnessConfig.fairness.weights.botDetection}`);
    console.log(`- Timing weight: ${cryptoFairnessConfig.fairness.weights.timing}`);
    
    console.log('\n🎯 Ready to monitor crypto events for fairness violations!');
    console.log('📊 API available at: http://localhost:' + cryptoFairnessConfig.server.port);
    console.log('🔑 Use X-API-Key header for authentication');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await probeOrchestrator.stop();
      await mempoolMonitor.stopMonitoring();
      console.log('✅ Shutdown complete');
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await probeOrchestrator.stop();
      await mempoolMonitor.stopMonitoring();
      console.log('✅ Shutdown complete');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start Crypto Fairness Relayer:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Application failed to start:', error);
    process.exit(1);
  });
}

export { cryptoFairnessConfig };
export { ProbeOrchestrator };
export { MempoolMonitor };
export { FairnessAnalyzer };
