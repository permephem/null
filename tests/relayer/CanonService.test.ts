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

describe('CanonService base fee handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the latest base fee from the contract for each warrant anchor', async () => {
    let currentBaseFee = ethers.parseEther('0.01');

    const waitMocks = [
      jest.fn().mockResolvedValue({ hash: '0xanchor1', blockNumber: 100 }),
      jest.fn().mockResolvedValue({ hash: '0xanchor2', blockNumber: 101 }),
    ];

    const mockContract = {
      baseFee: jest.fn(async () => currentBaseFee),
      anchorWarrant: jest
        .fn()
        .mockResolvedValueOnce({ wait: waitMocks[0] })
        .mockResolvedValueOnce({ wait: waitMocks[1] }),
      anchorAttestation: jest.fn(),
    } as any;

    connectMock.mockReturnValue(mockContract);

    const service = new CanonService(baseConfig);

    const warrantArgs: [string, string, string, string, string] = [
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      'enterprise-1',
      'warrant-1',
    ];

    const firstHash = await service.anchorWarrant(
      ...warrantArgs,
      '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      'subject-tag',
      1
    );

    expect(firstHash).toBe('0xanchor1');
    expect(mockContract.baseFee).toHaveBeenCalledTimes(1);
    expect(mockContract.anchorWarrant).toHaveBeenNthCalledWith(
      1,
      ...warrantArgs,
      expect.objectContaining({ value: ethers.parseEther('0.01') })
    );

    currentBaseFee = ethers.parseEther('0.025');

    const secondHash = await service.anchorWarrant(
      ...warrantArgs,
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      'subject-tag-2',
      2
    );

    expect(secondHash).toBe('0xanchor2');
    expect(mockContract.baseFee).toHaveBeenCalledTimes(2);
    expect(mockContract.anchorWarrant).toHaveBeenNthCalledWith(
      2,
      ...warrantArgs,
      expect.objectContaining({ value: ethers.parseEther('0.025') })
    );
  });

  it('uses a configured base fee override when provided', async () => {
    const overrideBaseFee = ethers.parseEther('0.05');

    const waitMock = jest.fn().mockResolvedValue({ hash: '0xanchor-override', blockNumber: 200 });

    const mockContract = {
      baseFee: jest.fn(),
      anchorWarrant: jest.fn().mockResolvedValue({ wait: waitMock }),
      anchorAttestation: jest.fn(),
    } as any;

    connectMock.mockReturnValue(mockContract);

    const service = new CanonService({ ...baseConfig, baseFee: overrideBaseFee });

    const txHash = await service.anchorWarrant(
      '0x1111111111111111111111111111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333333333333333333333333333',
      'enterprise-2',
      'warrant-2',
      '0x4444444444444444444444444444444444444444444444444444444444444444',
      'subject-tag-override',
      1
    );

    expect(txHash).toBe('0xanchor-override');
    expect(mockContract.baseFee).not.toHaveBeenCalled();
    expect(mockContract.anchorWarrant).toHaveBeenCalledWith(
      '0x1111111111111111111111111111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333333333333333333333333333',
      'enterprise-2',
      'warrant-2',
      expect.objectContaining({ value: overrideBaseFee })
    );
  });

  it('applies the latest base fee when anchoring attestations', async () => {
    let currentBaseFee = ethers.parseEther('0.015');

    const waitMock = jest.fn().mockResolvedValue({ hash: '0xattestation', blockNumber: 300 });

    const mockContract = {
      baseFee: jest.fn(async () => currentBaseFee),
      anchorWarrant: jest.fn(),
      anchorAttestation: jest.fn().mockResolvedValue({ wait: waitMock }),
    } as any;

    connectMock.mockReturnValue(mockContract);

    const service = new CanonService(baseConfig);

    const result = await service.anchorAttestation(
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      'enterprise-3',
      'attestation-1',
      '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      'subject-tag-attestation',
      1
    );

    expect(result).toEqual({ success: true, blockNumber: 300 });
    expect(mockContract.baseFee).toHaveBeenCalledTimes(1);
    expect(mockContract.anchorAttestation).toHaveBeenCalledWith(
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      'enterprise-3',
      'attestation-1',
      expect.objectContaining({ value: ethers.parseEther('0.015') })
    );

    currentBaseFee = ethers.parseEther('0.02');
    const waitMockUpdated = jest.fn().mockResolvedValue({ hash: '0xattestation2', blockNumber: 301 });
    mockContract.anchorAttestation.mockResolvedValueOnce({ wait: waitMockUpdated });

    const secondResult = await service.anchorAttestation(
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      'enterprise-3',
      'attestation-2',
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      'subject-tag-attestation-2',
      2
    );

    expect(secondResult).toEqual({ success: true, blockNumber: 301 });
    expect(mockContract.baseFee).toHaveBeenCalledTimes(2);
    expect(mockContract.anchorAttestation).toHaveBeenLastCalledWith(
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      'enterprise-3',
      'attestation-2',
      expect.objectContaining({ value: ethers.parseEther('0.02') })
    );
  });
});
