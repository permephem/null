import { ethers } from 'ethers';
import type { BigNumberish, ContractTransactionReceipt } from 'ethers';
import type { CanonRegistry } from '../../../typechain-types';
import { CanonRegistry__factory } from '../../../typechain-types';
import logger from '../utils/logger.js';

export interface CanonServiceConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
  /**
   * Optional override for the base fee (in wei) that should be paid when anchoring.
   * When omitted the service will query the Canon Registry contract for the
   * latest base fee before each transaction.
   */
  baseFee?: BigNumberish;
}

export class CanonService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: CanonRegistry;
  private readonly baseFeeOverride?: bigint;

  constructor(config: CanonServiceConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = CanonRegistry__factory.connect(config.contractAddress, this.wallet);
    this.baseFeeOverride =
      config.baseFee !== undefined ? ethers.toBigInt(config.baseFee) : undefined;
  }

  getContract(): CanonRegistry {
    return this.contract;
  }

  private async resolveBaseFee(): Promise<bigint> {
    if (this.baseFeeOverride !== undefined) {
      return this.baseFeeOverride;
    }

    const baseFee = await this.contract.baseFee();
    return baseFee;
  }

  private ensureBytes32(value: string): string {
    return value.startsWith('0x') ? value : `0x${value}`;
  }

  async anchor(
    params: {
      warrantDigest: string;
      attestationDigest?: string;
      subjectTag: string;
      controllerDidHash: string;
      assurance: number;
    }
  ): Promise<ContractTransactionReceipt> {
    const {
      warrantDigest,
      attestationDigest,
      subjectTag,
      controllerDidHash,
      assurance,
    } = params;

    try {
      logger.info('Anchoring closure event to canon registry', {
        warrantDigest,
        attestationDigest,
      });

      const baseFee = await this.resolveBaseFee();

      const normalizedWarrantDigest = this.ensureBytes32(warrantDigest);
      const normalizedAttestationDigest = attestationDigest
        ? this.ensureBytes32(attestationDigest)
        : ethers.ZeroHash;
      const normalizedSubjectTag = this.ensureBytes32(subjectTag);
      const normalizedControllerDidHash = this.ensureBytes32(controllerDidHash);

      const tx = await this.contract.anchor(
        normalizedWarrantDigest,
        normalizedAttestationDigest,
        normalizedSubjectTag,
        normalizedControllerDidHash,
        assurance,
        { value: baseFee }
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      logger.info('Closure event anchored successfully', {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return receipt;
    } catch (error) {
      logger.error('Failed to anchor closure event', {
        warrantDigest,
        attestationDigest,
        error,
      });
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