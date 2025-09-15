import { ethers } from 'ethers';
import logger from '../utils/logger.js';

export interface SBTServiceConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
}

export class SBTService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor(config: SBTServiceConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);

    // Placeholder contract ABI - would be imported from compiled contracts
    const contractABI = [
      'function safeMint(address to, bytes32 receiptHash) external',
      'function setSbtMintingEnabled(bool _enabled) external',
      'function sbtMintingEnabled() external view returns (bool)',
    ];

    this.contract = new ethers.Contract(config.contractAddress, contractABI, this.wallet);
  }

  async mintReceipt(to: string, receiptHash: string): Promise<string> {
    try {
      logger.info('Minting SBT receipt', { to, receiptHash });

      const tx = await this.contract.safeMint(to, receiptHash);
      const receipt = await tx.wait();

      logger.info('SBT receipt minted successfully', {
        to,
        receiptHash,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to mint SBT receipt', { to, receiptHash, error });
      throw error;
    }
  }

  async isMintingEnabled(): Promise<boolean> {
    try {
      return await this.contract.sbtMintingEnabled();
    } catch (error) {
      logger.error('Failed to check SBT minting status', { error });
      return false;
    }
  }

  async setMintingEnabled(enabled: boolean): Promise<string> {
    try {
      logger.info('Setting SBT minting status', { enabled });

      const tx = await this.contract.setSbtMintingEnabled(enabled);
      const receipt = await tx.wait();

      logger.info('SBT minting status updated', {
        enabled,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to set SBT minting status', { enabled, error });
      throw error;
    }
  }
}
