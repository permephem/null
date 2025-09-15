import { ethers } from 'ethers';
import { CanonRegistry, CanonRegistry__factory } from '../../../typechain-types/index.js';
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

  async anchorWarrant(
    warrantHash: string,
    subjectHandleHash: string,
    enterpriseHash: string,
    enterpriseId: string,
    warrantId: string,
    controllerDidHash: string,
    subjectTag: string,
    assurance: number
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
        controllerDidHash,
        subjectTag,
        assurance
      );

      const receipt = await tx.wait();
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
    controllerDidHash: string,
    subjectTag: string,
    assurance: number
  ): Promise<{ success: boolean; blockNumber?: number; error?: string }> {
    try {
      logger.info('Anchoring attestation to canon registry', { attestationId });

      const tx = await this.contract.anchorAttestation(
        attestationHash,
        warrantHash,
        enterpriseHash,
        enterpriseId,
        attestationId,
        controllerDidHash,
        subjectTag,
        assurance
      );

      const receipt = await tx.wait();
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

  async warrantExists(warrantId: string): Promise<boolean> {
    try {
      logger.info('Checking if warrant exists', { warrantId });
      // For now, we'll check if the warrant hash has been anchored
      // In a real implementation, we might have a separate mapping for warrant IDs
      const warrantHash = ethers.keccak256(ethers.toUtf8Bytes(warrantId));
      return await this.isAnchored(warrantHash);
    } catch (error) {
      logger.error('Failed to check if warrant exists', { warrantId, error });
      return false;
    }
  }
}
