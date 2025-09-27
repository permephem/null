import { ethers } from 'ethers';
import type { CanonRegistry } from '../../../typechain-types';
import { CanonRegistry__factory } from '../../../typechain-types';
import logger from '../utils/logger.js';

export interface CanonServiceConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
}

export class CanonService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: CanonRegistry;

  constructor(config: CanonServiceConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = CanonRegistry__factory.connect(config.contractAddress, this.wallet);
  }

  getContract(): CanonRegistry {
    return this.contract;
  }

  async anchorWarrant(
    warrantHash: string,
    subjectHandleHash: string,
    enterpriseHash: string,
    enterpriseId: string,
    warrantId: string,
    _controllerDidHash: string,
    _subjectTag: string,
    _assurance: number
  ): Promise<string> {
    try {
      logger.info('Anchoring warrant to canon registry', { warrantId, enterpriseId });

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.anchorWarrant(
        warrantHash,
        subjectHandleHash,
        enterpriseHash,
        enterpriseId,
        warrantId,
        { value: ethers.parseEther('0.01') } // Pay the base fee
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }
      logger.info('Warrant anchored successfully', {
        warrantId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to anchor warrant', { warrantId, error });
      throw error;
    }
  }

  async getLastAnchorBlock(hash: string): Promise<number> {
    try {
      logger.info('Getting last anchor block for hash', { hash });
      const blockNumber = await this.contract.lastAnchorBlock(hash);
      return Number(blockNumber);
    } catch (error) {
      logger.error('Failed to get last anchor block', { hash, error });
      throw error;
    }
  }

  async anchorAttestation(
    attestationHash: string,
    warrantHash: string,
    enterpriseHash: string,
    enterpriseId: string,
    attestationId: string,
    _controllerDidHash: string,
    _subjectTag: string,
    _assurance: number
  ): Promise<{ success: boolean; blockNumber?: number; error?: string }> {
    try {
      logger.info('Anchoring attestation to canon registry', { attestationId });

      const tx = await this.contract.anchorAttestation(
        attestationHash,
        warrantHash,
        enterpriseHash,
        enterpriseId,
        attestationId,
        { value: ethers.parseEther('0.01') } // Pay the base fee
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }
      logger.info('Attestation anchored successfully', {
        attestationId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return { success: true, blockNumber: receipt.blockNumber };
    } catch (error) {
      logger.error('Failed to anchor attestation', { attestationId, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getWarrantDigestById(warrantId: string): Promise<string | undefined> {
    try {
      logger.info('Fetching warrant digest from canon registry', { warrantId });
      const filter = this.contract.filters.WarrantAnchored(
        null,
        null,
        null,
        null,
        warrantId
      );
      const events = await this.contract.queryFilter(filter);
      if (!events.length) {
        return undefined;
      }
      const latestEvent = events[events.length - 1];
      const digest = latestEvent.args?.warrantHash;
      if (!digest) {
        return undefined;
      }
      return ethers.hexlify(digest);
    } catch (error) {
      logger.error('Failed to fetch warrant digest from blockchain', { warrantId, error });
      return undefined;
    }
  }

  async isAnchored(hash: string): Promise<boolean> {
    try {
      logger.info('Checking if hash is anchored', { hash });
      const blockNumber = await this.contract.lastAnchorBlock(hash);
      return Number(blockNumber) > 0;
    } catch (error) {
      logger.error('Failed to check if hash is anchored', { hash, error });
      return false;
    }
  }

  async warrantExists(warrantDigest: string): Promise<boolean> {
    try {
      logger.info('Checking if warrant exists', { warrantDigest });
      return await this.isAnchored(warrantDigest);
    } catch (error) {
      logger.error('Failed to check if warrant exists', { warrantDigest, error });
      return false;
    }
  }
}
