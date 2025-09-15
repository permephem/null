import { ethers } from 'ethers';
import type { MaskSBT } from '../../../typechain-types';
import { MaskSBT__factory } from '../../../typechain-types';
import logger from '../utils/logger.js';

export interface SBTServiceConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
}

export class SBTService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: MaskSBT;

  constructor(config: SBTServiceConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = MaskSBT__factory.connect(config.contractAddress, this.wallet);
  }

  async mintReceipt(to: string, receiptHash: string): Promise<string> {
    try {
      logger.info('Minting SBT receipt', { to, receiptHash });

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.mintReceipt(to, receiptHash);
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

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
      if (!this.contract) {
        return false;
      }

      return await this.contract.sbtMintingEnabled();
    } catch (error) {
      logger.error('Failed to check SBT minting status', { error });
      return false;
    }
  }

  async setMintingEnabled(enabled: boolean): Promise<string> {
    try {
      logger.info('Setting SBT minting status', { enabled });

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      // Note: This method may not be available in the current contract version
      // For now, we'll just log the attempt
      logger.warn('setSbtMintingEnabled method not available in current contract version', { enabled });
      return 'not-implemented';
    } catch (error) {
      logger.error('Failed to set SBT minting status', { enabled, error });
      throw error;
    }
  }
}
