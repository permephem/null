import { ethers } from 'ethers';
import type { MaskSBT } from '../../../typechain-types';
import { MaskSBT__factory } from '../../../typechain-types';
import logger from '../utils/logger.js';

export interface SBTServiceConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
}

export interface MintReceiptResult {
  transactionHash: string;
  tokenId: string;
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

  async mintReceipt(to: string, receiptHash: string): Promise<MintReceiptResult> {
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

      let mintedTokenId: string | undefined;

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== this.contract.target.toLowerCase()) {
          continue;
        }

        try {
          const parsedLog = this.contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'ReceiptMinted') {
            const tokenIdArg = parsedLog.args?.tokenId;
            if (tokenIdArg !== undefined) {
              mintedTokenId = tokenIdArg.toString();
              break;
            }
          }
        } catch (parseError) {
          const logIndex = (log as any).index ?? (log as any).logIndex;
          logger.warn('Failed to parse log while extracting tokenId', {
            receiptHash,
            logIndex,
            error: parseError,
          });
        }
      }

      if (!mintedTokenId) {
        throw new Error('Unable to determine minted tokenId from transaction logs');
      }

      logger.info('SBT receipt minted successfully', {
        to,
        receiptHash,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        tokenId: mintedTokenId,
      });

      return { transactionHash: receipt.hash, tokenId: mintedTokenId };
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
      logger.warn('setSbtMintingEnabled method not available in current contract version', {
        enabled,
      });
      return 'not-implemented';
    } catch (error) {
      logger.error('Failed to set SBT minting status', { enabled, error });
      throw error;
    }
  }

  async isReceiptMinted(receiptHash: string): Promise<boolean> {
    try {
      if (!this.contract) {
        return false;
      }

      return await this.contract.isReceiptMinted(receiptHash);
    } catch (error) {
      logger.error('Failed to check if receipt is minted', { receiptHash, error });
      return false;
    }
  }

  getContract(): MaskSBT {
    return this.contract;
  }
}
