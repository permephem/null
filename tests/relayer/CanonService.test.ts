import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ethers } from 'ethers';
import { CanonService } from '../../relayer/src/canon/CanonService';
import { CanonRegistry__factory } from '../../typechain-types';

jest.mock('../../typechain-types', () => ({
  __esModule: true,
  CanonRegistry__factory: {
    connect: jest.fn(),
  },
}));

const connectMock = CanonRegistry__factory.connect as jest.Mock;

const baseConfig = {
  rpcUrl: 'http://localhost:8545',
  privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
};

describe('CanonService.anchor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the latest base fee and forwards hashed fields for each anchor call', async () => {
    let currentBaseFee = ethers.parseEther('0.01');

    const waitMocks = [
      jest.fn().mockResolvedValue({ hash: '0xanchor1', blockNumber: 100 }),
      jest.fn().mockResolvedValue({ hash: '0xanchor2', blockNumber: 101 }),
    ];

    const mockContract = {
      baseFee: jest.fn(async () => currentBaseFee),
      anchor: jest
        .fn()
        .mockResolvedValueOnce({ wait: waitMocks[0] })
        .mockResolvedValueOnce({ wait: waitMocks[1] }),
    } as any;

    connectMock.mockReturnValue(mockContract);

    const service = new CanonService(baseConfig);

    const warrantDigest = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const controllerDidHash = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const subjectTag = 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

    const firstReceipt = await service.anchor({
      warrantDigest,
      subjectTag,
      controllerDidHash,
      assurance: 1,
    });

    expect(firstReceipt.hash).toBe('0xanchor1');
    expect(mockContract.baseFee).toHaveBeenCalledTimes(1);
    expect(mockContract.anchor).toHaveBeenNthCalledWith(
      1,
      warrantDigest,
      ethers.ZeroHash,
      `0x${subjectTag}`,
      controllerDidHash,
      1,
      expect.objectContaining({ value: ethers.parseEther('0.01') })
    );

    currentBaseFee = ethers.parseEther('0.025');

    const attestationDigest = '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
    const subjectTagPrefixed = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

    const secondReceipt = await service.anchor({
      warrantDigest,
      attestationDigest,
      subjectTag: subjectTagPrefixed,
      controllerDidHash,
      assurance: 2,
    });

    expect(secondReceipt.hash).toBe('0xanchor2');
    expect(mockContract.baseFee).toHaveBeenCalledTimes(2);
    expect(mockContract.anchor).toHaveBeenNthCalledWith(
      2,
      warrantDigest,
      attestationDigest,
      subjectTagPrefixed,
      controllerDidHash,
      2,
      expect.objectContaining({ value: ethers.parseEther('0.025') })
    );
  });

  it('uses a configured base fee override when provided', async () => {
    const overrideBaseFee = ethers.parseEther('0.05');

    const waitMock = jest.fn().mockResolvedValue({ hash: '0xanchor-override', blockNumber: 200 });

    const mockContract = {
      baseFee: jest.fn(),
      anchor: jest.fn().mockResolvedValue({ wait: waitMock }),
    } as any;

    connectMock.mockReturnValue(mockContract);

    const service = new CanonService({ ...baseConfig, baseFee: overrideBaseFee });

    const receipt = await service.anchor({
      warrantDigest: '0x1111111111111111111111111111111111111111111111111111111111111111',
      subjectTag: '2222222222222222222222222222222222222222222222222222222222222222',
      controllerDidHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
      assurance: 1,
    });

    expect(receipt.hash).toBe('0xanchor-override');
    expect(mockContract.baseFee).not.toHaveBeenCalled();
    expect(mockContract.anchor).toHaveBeenCalledWith(
      '0x1111111111111111111111111111111111111111111111111111111111111111',
      ethers.ZeroHash,
      '0x2222222222222222222222222222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333333333333333333333333333',
      1,
      expect.objectContaining({ value: overrideBaseFee })
    );
  });
});