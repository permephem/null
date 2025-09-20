import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from 'ethers';
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from './common';
export interface MaskSBTInterface extends Interface {
  getFunction(
    nameOrSignature:
      | 'ADMIN_ROLE'
      | 'DEFAULT_ADMIN_ROLE'
      | 'MINTER_ROLE'
      | 'approve'
      | 'balanceOf'
      | 'burnReceipt'
      | 'getApproved'
      | 'getMintTimestamp'
      | 'getOriginalMinter'
      | 'getReceiptHash'
      | 'getRoleAdmin'
      | 'grantRole'
      | 'hasRole'
      | 'isApprovedForAll'
      | 'isReceiptMinted'
      | 'mintReceipt'
      | 'mintTimestamps'
      | 'name'
      | 'originalMinter'
      | 'ownerOf'
      | 'pause'
      | 'paused'
      | 'receiptHashes'
      | 'renounceRole'
      | 'revokeRole'
      | 'safeTransferFrom(address,address,uint256)'
      | 'safeTransferFrom(address,address,uint256,bytes)'
      | 'sbtMintingEnabled'
      | 'setApprovalForAll'
      | 'supportsInterface'
      | 'symbol'
      | 'toggleSBTMinting'
      | 'toggleTransfer'
      | 'tokenURI'
      | 'totalBurned'
      | 'totalMinted'
      | 'totalSupply'
      | 'transferEnabled'
      | 'transferFrom'
      | 'unpause'
  ): FunctionFragment;
  getEvent(
    nameOrSignatureOrTopic:
      | 'Approval'
      | 'ApprovalForAll'
      | 'Paused'
      | 'ReceiptBurned'
      | 'ReceiptMinted'
      | 'RoleAdminChanged'
      | 'RoleGranted'
      | 'RoleRevoked'
      | 'SBTMintingToggled'
      | 'Transfer'
      | 'TransferToggled'
      | 'Unpaused'
  ): EventFragment;
  encodeFunctionData(functionFragment: 'ADMIN_ROLE', values?: undefined): string;
  encodeFunctionData(functionFragment: 'DEFAULT_ADMIN_ROLE', values?: undefined): string;
  encodeFunctionData(functionFragment: 'MINTER_ROLE', values?: undefined): string;
  encodeFunctionData(functionFragment: 'approve', values: [AddressLike, BigNumberish]): string;
  encodeFunctionData(functionFragment: 'balanceOf', values: [AddressLike]): string;
  encodeFunctionData(functionFragment: 'burnReceipt', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'getApproved', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'getMintTimestamp', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'getOriginalMinter', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'getReceiptHash', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'getRoleAdmin', values: [BytesLike]): string;
  encodeFunctionData(functionFragment: 'grantRole', values: [BytesLike, AddressLike]): string;
  encodeFunctionData(functionFragment: 'hasRole', values: [BytesLike, AddressLike]): string;
  encodeFunctionData(
    functionFragment: 'isApprovedForAll',
    values: [AddressLike, AddressLike]
  ): string;
  encodeFunctionData(functionFragment: 'isReceiptMinted', values: [BytesLike]): string;
  encodeFunctionData(functionFragment: 'mintReceipt', values: [AddressLike, BytesLike]): string;
  encodeFunctionData(functionFragment: 'mintTimestamps', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'name', values?: undefined): string;
  encodeFunctionData(functionFragment: 'originalMinter', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'ownerOf', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'pause', values?: undefined): string;
  encodeFunctionData(functionFragment: 'paused', values?: undefined): string;
  encodeFunctionData(functionFragment: 'receiptHashes', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'renounceRole', values: [BytesLike, AddressLike]): string;
  encodeFunctionData(functionFragment: 'revokeRole', values: [BytesLike, AddressLike]): string;
  encodeFunctionData(
    functionFragment: 'safeTransferFrom(address,address,uint256)',
    values: [AddressLike, AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: 'safeTransferFrom(address,address,uint256,bytes)',
    values: [AddressLike, AddressLike, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: 'sbtMintingEnabled', values?: undefined): string;
  encodeFunctionData(functionFragment: 'setApprovalForAll', values: [AddressLike, boolean]): string;
  encodeFunctionData(functionFragment: 'supportsInterface', values: [BytesLike]): string;
  encodeFunctionData(functionFragment: 'symbol', values?: undefined): string;
  encodeFunctionData(functionFragment: 'toggleSBTMinting', values: [boolean]): string;
  encodeFunctionData(functionFragment: 'toggleTransfer', values: [boolean]): string;
  encodeFunctionData(functionFragment: 'tokenURI', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'totalBurned', values?: undefined): string;
  encodeFunctionData(functionFragment: 'totalMinted', values?: undefined): string;
  encodeFunctionData(functionFragment: 'totalSupply', values?: undefined): string;
  encodeFunctionData(functionFragment: 'transferEnabled', values?: undefined): string;
  encodeFunctionData(
    functionFragment: 'transferFrom',
    values: [AddressLike, AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: 'unpause', values?: undefined): string;
  decodeFunctionResult(functionFragment: 'ADMIN_ROLE', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'DEFAULT_ADMIN_ROLE', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'MINTER_ROLE', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'approve', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'balanceOf', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'burnReceipt', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'getApproved', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'getMintTimestamp', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'getOriginalMinter', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'getReceiptHash', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'getRoleAdmin', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'grantRole', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'hasRole', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'isApprovedForAll', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'isReceiptMinted', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'mintReceipt', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'mintTimestamps', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'name', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'originalMinter', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'ownerOf', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'pause', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'paused', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'receiptHashes', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'renounceRole', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'revokeRole', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'safeTransferFrom(address,address,uint256)',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'safeTransferFrom(address,address,uint256,bytes)',
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: 'sbtMintingEnabled', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'setApprovalForAll', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'supportsInterface', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'symbol', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'toggleSBTMinting', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'toggleTransfer', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'tokenURI', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'totalBurned', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'totalMinted', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'totalSupply', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'transferEnabled', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'transferFrom', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'unpause', data: BytesLike): Result;
}
export declare namespace ApprovalEvent {
  type InputTuple = [owner: AddressLike, approved: AddressLike, tokenId: BigNumberish];
  type OutputTuple = [owner: string, approved: string, tokenId: bigint];
  interface OutputObject {
    owner: string;
    approved: string;
    tokenId: bigint;
  }
  type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  type Filter = TypedDeferredTopicFilter<Event>;
  type Log = TypedEventLog<Event>;
  type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ApprovalForAllEvent {
  type InputTuple = [owner: AddressLike, operator: AddressLike, approved: boolean];
  type OutputTuple = [owner: string, operator: string, approved: boolean];
  interface OutputObject {
    owner: string;
    operator: string;
    approved: boolean;
  }
  type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  type Filter = TypedDeferredTopicFilter<Event>;
  type Log = TypedEventLog<Event>;
  type LogDescription = TypedLogDescription<Event>;
}
export declare namespace PausedEvent {
  type InputTuple = [account: AddressLike];
  type OutputTuple = [account: string];
  interface OutputObject {
    account: string;
  }
  type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  type Filter = TypedDeferredTopicFilter<Event>;
  type Log = TypedEventLog<Event>;
  type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ReceiptBurnedEvent {
  type InputTuple = [
    tokenId: BigNumberish,
    receiptHash: BytesLike,
    owner: AddressLike,
    timestamp: BigNumberish,
  ];
  type OutputTuple = [tokenId: bigint, receiptHash: string, owner: string, timestamp: bigint];
  interface OutputObject {
    tokenId: bigint;
    receiptHash: string;
    owner: string;
    timestamp: bigint;
  }
  type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  type Filter = TypedDeferredTopicFilter<Event>;
  type Log = TypedEventLog<Event>;
  type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ReceiptMintedEvent {
  type InputTuple = [
    tokenId: BigNumberish,
    receiptHash: BytesLike,
    recipient: AddressLike,
    minter: AddressLike,
    timestamp: BigNumberish,
  ];
  type OutputTuple = [
    tokenId: bigint,
    receiptHash: string,
    recipient: string,
    minter: string,
    timestamp: bigint,
  ];
  interface OutputObject {
    tokenId: bigint;
    receiptHash: string;
    recipient: string;
    minter: string;
    timestamp: bigint;
  }
  type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  type Filter = TypedDeferredTopicFilter<Event>;
  type Log = TypedEventLog<Event>;
  type LogDescription = TypedLogDescription<Event>;
}
export declare namespace RoleAdminChangedEvent {
  type InputTuple = [role: BytesLike, previousAdminRole: BytesLike, newAdminRole: BytesLike];
  type OutputTuple = [role: string, previousAdminRole: string, newAdminRole: string];
  interface OutputObject {
    role: string;
    previousAdminRole: string;
    newAdminRole: string;
  }
  type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  type Filter = TypedDeferredTopicFilter<Event>;
  type Log = TypedEventLog<Event>;
  type LogDescription = TypedLogDescription<Event>;
}
export declare namespace RoleGrantedEvent {
  type InputTuple = [role: BytesLike, account: AddressLike, sender: AddressLike];
  type OutputTuple = [role: string, account: string, sender: string];
  interface OutputObject {
    role: string;
    account: string;
    sender: string;
  }
  type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  type Filter = TypedDeferredTopicFilter<Event>;
  type Log = TypedEventLog<Event>;
  type LogDescription = TypedLogDescription<Event>;
}
export declare namespace RoleRevokedEvent {
  type InputTuple = [role: BytesLike, account: AddressLike, sender: AddressLike];
  type OutputTuple = [role: string, account: string, sender: string];
  interface OutputObject {
    role: string;
    account: string;
    sender: string;
  }
  type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  type Filter = TypedDeferredTopicFilter<Event>;
  type Log = TypedEventLog<Event>;
  type LogDescription = TypedLogDescription<Event>;
}
export declare namespace SBTMintingToggledEvent {
  type InputTuple = [enabled: boolean];
  type OutputTuple = [enabled: boolean];
  interface OutputObject {
    enabled: boolean;
  }
  type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  type Filter = TypedDeferredTopicFilter<Event>;
  type Log = TypedEventLog<Event>;
  type LogDescription = TypedLogDescription<Event>;
}
export declare namespace TransferEvent {
  type InputTuple = [from: AddressLike, to: AddressLike, tokenId: BigNumberish];
  type OutputTuple = [from: string, to: string, tokenId: bigint];
  interface OutputObject {
    from: string;
    to: string;
    tokenId: bigint;
  }
  type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  type Filter = TypedDeferredTopicFilter<Event>;
  type Log = TypedEventLog<Event>;
  type LogDescription = TypedLogDescription<Event>;
}
export declare namespace TransferToggledEvent {
  type InputTuple = [enabled: boolean];
  type OutputTuple = [enabled: boolean];
  interface OutputObject {
    enabled: boolean;
  }
  type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  type Filter = TypedDeferredTopicFilter<Event>;
  type Log = TypedEventLog<Event>;
  type LogDescription = TypedLogDescription<Event>;
}
export declare namespace UnpausedEvent {
  type InputTuple = [account: AddressLike];
  type OutputTuple = [account: string];
  interface OutputObject {
    account: string;
  }
  type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  type Filter = TypedDeferredTopicFilter<Event>;
  type Log = TypedEventLog<Event>;
  type LogDescription = TypedLogDescription<Event>;
}
export interface MaskSBT extends BaseContract {
  connect(runner?: ContractRunner | null): MaskSBT;
  waitForDeployment(): Promise<this>;
  interface: MaskSBTInterface;
  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
  ADMIN_ROLE: TypedContractMethod<[], [string], 'view'>;
  DEFAULT_ADMIN_ROLE: TypedContractMethod<[], [string], 'view'>;
  MINTER_ROLE: TypedContractMethod<[], [string], 'view'>;
  approve: TypedContractMethod<[to: AddressLike, tokenId: BigNumberish], [void], 'nonpayable'>;
  balanceOf: TypedContractMethod<[owner: AddressLike], [bigint], 'view'>;
  burnReceipt: TypedContractMethod<[tokenId: BigNumberish], [void], 'nonpayable'>;
  getApproved: TypedContractMethod<[tokenId: BigNumberish], [string], 'view'>;
  getMintTimestamp: TypedContractMethod<[tokenId: BigNumberish], [bigint], 'view'>;
  getOriginalMinter: TypedContractMethod<[tokenId: BigNumberish], [string], 'view'>;
  getReceiptHash: TypedContractMethod<[tokenId: BigNumberish], [string], 'view'>;
  getRoleAdmin: TypedContractMethod<[role: BytesLike], [string], 'view'>;
  grantRole: TypedContractMethod<[role: BytesLike, account: AddressLike], [void], 'nonpayable'>;
  hasRole: TypedContractMethod<[role: BytesLike, account: AddressLike], [boolean], 'view'>;
  isApprovedForAll: TypedContractMethod<
    [owner: AddressLike, operator: AddressLike],
    [boolean],
    'view'
  >;
  isReceiptMinted: TypedContractMethod<[receiptHash: BytesLike], [boolean], 'view'>;
  mintReceipt: TypedContractMethod<
    [to: AddressLike, receiptHash: BytesLike],
    [bigint],
    'nonpayable'
  >;
  mintTimestamps: TypedContractMethod<[arg0: BigNumberish], [bigint], 'view'>;
  name: TypedContractMethod<[], [string], 'view'>;
  originalMinter: TypedContractMethod<[arg0: BigNumberish], [string], 'view'>;
  ownerOf: TypedContractMethod<[tokenId: BigNumberish], [string], 'view'>;
  pause: TypedContractMethod<[], [void], 'nonpayable'>;
  paused: TypedContractMethod<[], [boolean], 'view'>;
  receiptHashes: TypedContractMethod<[arg0: BigNumberish], [string], 'view'>;
  renounceRole: TypedContractMethod<
    [role: BytesLike, callerConfirmation: AddressLike],
    [void],
    'nonpayable'
  >;
  revokeRole: TypedContractMethod<[role: BytesLike, account: AddressLike], [void], 'nonpayable'>;
  'safeTransferFrom(address,address,uint256)': TypedContractMethod<
    [from: AddressLike, to: AddressLike, tokenId: BigNumberish],
    [void],
    'nonpayable'
  >;
  'safeTransferFrom(address,address,uint256,bytes)': TypedContractMethod<
    [from: AddressLike, to: AddressLike, tokenId: BigNumberish, data: BytesLike],
    [void],
    'nonpayable'
  >;
  sbtMintingEnabled: TypedContractMethod<[], [boolean], 'view'>;
  setApprovalForAll: TypedContractMethod<
    [operator: AddressLike, approved: boolean],
    [void],
    'nonpayable'
  >;
  supportsInterface: TypedContractMethod<[interfaceId: BytesLike], [boolean], 'view'>;
  symbol: TypedContractMethod<[], [string], 'view'>;
  toggleSBTMinting: TypedContractMethod<[enabled: boolean], [void], 'nonpayable'>;
  toggleTransfer: TypedContractMethod<[enabled: boolean], [void], 'nonpayable'>;
  tokenURI: TypedContractMethod<[tokenId: BigNumberish], [string], 'view'>;
  totalBurned: TypedContractMethod<[], [bigint], 'view'>;
  totalMinted: TypedContractMethod<[], [bigint], 'view'>;
  totalSupply: TypedContractMethod<[], [bigint], 'view'>;
  transferEnabled: TypedContractMethod<[], [boolean], 'view'>;
  transferFrom: TypedContractMethod<
    [from: AddressLike, to: AddressLike, tokenId: BigNumberish],
    [void],
    'nonpayable'
  >;
  unpause: TypedContractMethod<[], [void], 'nonpayable'>;
  getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
  getFunction(nameOrSignature: 'ADMIN_ROLE'): TypedContractMethod<[], [string], 'view'>;
  getFunction(nameOrSignature: 'DEFAULT_ADMIN_ROLE'): TypedContractMethod<[], [string], 'view'>;
  getFunction(nameOrSignature: 'MINTER_ROLE'): TypedContractMethod<[], [string], 'view'>;
  getFunction(
    nameOrSignature: 'approve'
  ): TypedContractMethod<[to: AddressLike, tokenId: BigNumberish], [void], 'nonpayable'>;
  getFunction(
    nameOrSignature: 'balanceOf'
  ): TypedContractMethod<[owner: AddressLike], [bigint], 'view'>;
  getFunction(
    nameOrSignature: 'burnReceipt'
  ): TypedContractMethod<[tokenId: BigNumberish], [void], 'nonpayable'>;
  getFunction(
    nameOrSignature: 'getApproved'
  ): TypedContractMethod<[tokenId: BigNumberish], [string], 'view'>;
  getFunction(
    nameOrSignature: 'getMintTimestamp'
  ): TypedContractMethod<[tokenId: BigNumberish], [bigint], 'view'>;
  getFunction(
    nameOrSignature: 'getOriginalMinter'
  ): TypedContractMethod<[tokenId: BigNumberish], [string], 'view'>;
  getFunction(
    nameOrSignature: 'getReceiptHash'
  ): TypedContractMethod<[tokenId: BigNumberish], [string], 'view'>;
  getFunction(
    nameOrSignature: 'getRoleAdmin'
  ): TypedContractMethod<[role: BytesLike], [string], 'view'>;
  getFunction(
    nameOrSignature: 'grantRole'
  ): TypedContractMethod<[role: BytesLike, account: AddressLike], [void], 'nonpayable'>;
  getFunction(
    nameOrSignature: 'hasRole'
  ): TypedContractMethod<[role: BytesLike, account: AddressLike], [boolean], 'view'>;
  getFunction(
    nameOrSignature: 'isApprovedForAll'
  ): TypedContractMethod<[owner: AddressLike, operator: AddressLike], [boolean], 'view'>;
  getFunction(
    nameOrSignature: 'isReceiptMinted'
  ): TypedContractMethod<[receiptHash: BytesLike], [boolean], 'view'>;
  getFunction(
    nameOrSignature: 'mintReceipt'
  ): TypedContractMethod<[to: AddressLike, receiptHash: BytesLike], [bigint], 'nonpayable'>;
  getFunction(
    nameOrSignature: 'mintTimestamps'
  ): TypedContractMethod<[arg0: BigNumberish], [bigint], 'view'>;
  getFunction(nameOrSignature: 'name'): TypedContractMethod<[], [string], 'view'>;
  getFunction(
    nameOrSignature: 'originalMinter'
  ): TypedContractMethod<[arg0: BigNumberish], [string], 'view'>;
  getFunction(
    nameOrSignature: 'ownerOf'
  ): TypedContractMethod<[tokenId: BigNumberish], [string], 'view'>;
  getFunction(nameOrSignature: 'pause'): TypedContractMethod<[], [void], 'nonpayable'>;
  getFunction(nameOrSignature: 'paused'): TypedContractMethod<[], [boolean], 'view'>;
  getFunction(
    nameOrSignature: 'receiptHashes'
  ): TypedContractMethod<[arg0: BigNumberish], [string], 'view'>;
  getFunction(
    nameOrSignature: 'renounceRole'
  ): TypedContractMethod<[role: BytesLike, callerConfirmation: AddressLike], [void], 'nonpayable'>;
  getFunction(
    nameOrSignature: 'revokeRole'
  ): TypedContractMethod<[role: BytesLike, account: AddressLike], [void], 'nonpayable'>;
  getFunction(
    nameOrSignature: 'safeTransferFrom(address,address,uint256)'
  ): TypedContractMethod<
    [from: AddressLike, to: AddressLike, tokenId: BigNumberish],
    [void],
    'nonpayable'
  >;
  getFunction(
    nameOrSignature: 'safeTransferFrom(address,address,uint256,bytes)'
  ): TypedContractMethod<
    [from: AddressLike, to: AddressLike, tokenId: BigNumberish, data: BytesLike],
    [void],
    'nonpayable'
  >;
  getFunction(nameOrSignature: 'sbtMintingEnabled'): TypedContractMethod<[], [boolean], 'view'>;
  getFunction(
    nameOrSignature: 'setApprovalForAll'
  ): TypedContractMethod<[operator: AddressLike, approved: boolean], [void], 'nonpayable'>;
  getFunction(
    nameOrSignature: 'supportsInterface'
  ): TypedContractMethod<[interfaceId: BytesLike], [boolean], 'view'>;
  getFunction(nameOrSignature: 'symbol'): TypedContractMethod<[], [string], 'view'>;
  getFunction(
    nameOrSignature: 'toggleSBTMinting'
  ): TypedContractMethod<[enabled: boolean], [void], 'nonpayable'>;
  getFunction(
    nameOrSignature: 'toggleTransfer'
  ): TypedContractMethod<[enabled: boolean], [void], 'nonpayable'>;
  getFunction(
    nameOrSignature: 'tokenURI'
  ): TypedContractMethod<[tokenId: BigNumberish], [string], 'view'>;
  getFunction(nameOrSignature: 'totalBurned'): TypedContractMethod<[], [bigint], 'view'>;
  getFunction(nameOrSignature: 'totalMinted'): TypedContractMethod<[], [bigint], 'view'>;
  getFunction(nameOrSignature: 'totalSupply'): TypedContractMethod<[], [bigint], 'view'>;
  getFunction(nameOrSignature: 'transferEnabled'): TypedContractMethod<[], [boolean], 'view'>;
  getFunction(
    nameOrSignature: 'transferFrom'
  ): TypedContractMethod<
    [from: AddressLike, to: AddressLike, tokenId: BigNumberish],
    [void],
    'nonpayable'
  >;
  getFunction(nameOrSignature: 'unpause'): TypedContractMethod<[], [void], 'nonpayable'>;
  getEvent(
    key: 'Approval'
  ): TypedContractEvent<
    ApprovalEvent.InputTuple,
    ApprovalEvent.OutputTuple,
    ApprovalEvent.OutputObject
  >;
  getEvent(
    key: 'ApprovalForAll'
  ): TypedContractEvent<
    ApprovalForAllEvent.InputTuple,
    ApprovalForAllEvent.OutputTuple,
    ApprovalForAllEvent.OutputObject
  >;
  getEvent(
    key: 'Paused'
  ): TypedContractEvent<PausedEvent.InputTuple, PausedEvent.OutputTuple, PausedEvent.OutputObject>;
  getEvent(
    key: 'ReceiptBurned'
  ): TypedContractEvent<
    ReceiptBurnedEvent.InputTuple,
    ReceiptBurnedEvent.OutputTuple,
    ReceiptBurnedEvent.OutputObject
  >;
  getEvent(
    key: 'ReceiptMinted'
  ): TypedContractEvent<
    ReceiptMintedEvent.InputTuple,
    ReceiptMintedEvent.OutputTuple,
    ReceiptMintedEvent.OutputObject
  >;
  getEvent(
    key: 'RoleAdminChanged'
  ): TypedContractEvent<
    RoleAdminChangedEvent.InputTuple,
    RoleAdminChangedEvent.OutputTuple,
    RoleAdminChangedEvent.OutputObject
  >;
  getEvent(
    key: 'RoleGranted'
  ): TypedContractEvent<
    RoleGrantedEvent.InputTuple,
    RoleGrantedEvent.OutputTuple,
    RoleGrantedEvent.OutputObject
  >;
  getEvent(
    key: 'RoleRevoked'
  ): TypedContractEvent<
    RoleRevokedEvent.InputTuple,
    RoleRevokedEvent.OutputTuple,
    RoleRevokedEvent.OutputObject
  >;
  getEvent(
    key: 'SBTMintingToggled'
  ): TypedContractEvent<
    SBTMintingToggledEvent.InputTuple,
    SBTMintingToggledEvent.OutputTuple,
    SBTMintingToggledEvent.OutputObject
  >;
  getEvent(
    key: 'Transfer'
  ): TypedContractEvent<
    TransferEvent.InputTuple,
    TransferEvent.OutputTuple,
    TransferEvent.OutputObject
  >;
  getEvent(
    key: 'TransferToggled'
  ): TypedContractEvent<
    TransferToggledEvent.InputTuple,
    TransferToggledEvent.OutputTuple,
    TransferToggledEvent.OutputObject
  >;
  getEvent(
    key: 'Unpaused'
  ): TypedContractEvent<
    UnpausedEvent.InputTuple,
    UnpausedEvent.OutputTuple,
    UnpausedEvent.OutputObject
  >;
  filters: {
    'Approval(address,address,uint256)': TypedContractEvent<
      ApprovalEvent.InputTuple,
      ApprovalEvent.OutputTuple,
      ApprovalEvent.OutputObject
    >;
    Approval: TypedContractEvent<
      ApprovalEvent.InputTuple,
      ApprovalEvent.OutputTuple,
      ApprovalEvent.OutputObject
    >;
    'ApprovalForAll(address,address,bool)': TypedContractEvent<
      ApprovalForAllEvent.InputTuple,
      ApprovalForAllEvent.OutputTuple,
      ApprovalForAllEvent.OutputObject
    >;
    ApprovalForAll: TypedContractEvent<
      ApprovalForAllEvent.InputTuple,
      ApprovalForAllEvent.OutputTuple,
      ApprovalForAllEvent.OutputObject
    >;
    'Paused(address)': TypedContractEvent<
      PausedEvent.InputTuple,
      PausedEvent.OutputTuple,
      PausedEvent.OutputObject
    >;
    Paused: TypedContractEvent<
      PausedEvent.InputTuple,
      PausedEvent.OutputTuple,
      PausedEvent.OutputObject
    >;
    'ReceiptBurned(uint256,bytes32,address,uint256)': TypedContractEvent<
      ReceiptBurnedEvent.InputTuple,
      ReceiptBurnedEvent.OutputTuple,
      ReceiptBurnedEvent.OutputObject
    >;
    ReceiptBurned: TypedContractEvent<
      ReceiptBurnedEvent.InputTuple,
      ReceiptBurnedEvent.OutputTuple,
      ReceiptBurnedEvent.OutputObject
    >;
    'ReceiptMinted(uint256,bytes32,address,address,uint256)': TypedContractEvent<
      ReceiptMintedEvent.InputTuple,
      ReceiptMintedEvent.OutputTuple,
      ReceiptMintedEvent.OutputObject
    >;
    ReceiptMinted: TypedContractEvent<
      ReceiptMintedEvent.InputTuple,
      ReceiptMintedEvent.OutputTuple,
      ReceiptMintedEvent.OutputObject
    >;
    'RoleAdminChanged(bytes32,bytes32,bytes32)': TypedContractEvent<
      RoleAdminChangedEvent.InputTuple,
      RoleAdminChangedEvent.OutputTuple,
      RoleAdminChangedEvent.OutputObject
    >;
    RoleAdminChanged: TypedContractEvent<
      RoleAdminChangedEvent.InputTuple,
      RoleAdminChangedEvent.OutputTuple,
      RoleAdminChangedEvent.OutputObject
    >;
    'RoleGranted(bytes32,address,address)': TypedContractEvent<
      RoleGrantedEvent.InputTuple,
      RoleGrantedEvent.OutputTuple,
      RoleGrantedEvent.OutputObject
    >;
    RoleGranted: TypedContractEvent<
      RoleGrantedEvent.InputTuple,
      RoleGrantedEvent.OutputTuple,
      RoleGrantedEvent.OutputObject
    >;
    'RoleRevoked(bytes32,address,address)': TypedContractEvent<
      RoleRevokedEvent.InputTuple,
      RoleRevokedEvent.OutputTuple,
      RoleRevokedEvent.OutputObject
    >;
    RoleRevoked: TypedContractEvent<
      RoleRevokedEvent.InputTuple,
      RoleRevokedEvent.OutputTuple,
      RoleRevokedEvent.OutputObject
    >;
    'SBTMintingToggled(bool)': TypedContractEvent<
      SBTMintingToggledEvent.InputTuple,
      SBTMintingToggledEvent.OutputTuple,
      SBTMintingToggledEvent.OutputObject
    >;
    SBTMintingToggled: TypedContractEvent<
      SBTMintingToggledEvent.InputTuple,
      SBTMintingToggledEvent.OutputTuple,
      SBTMintingToggledEvent.OutputObject
    >;
    'Transfer(address,address,uint256)': TypedContractEvent<
      TransferEvent.InputTuple,
      TransferEvent.OutputTuple,
      TransferEvent.OutputObject
    >;
    Transfer: TypedContractEvent<
      TransferEvent.InputTuple,
      TransferEvent.OutputTuple,
      TransferEvent.OutputObject
    >;
    'TransferToggled(bool)': TypedContractEvent<
      TransferToggledEvent.InputTuple,
      TransferToggledEvent.OutputTuple,
      TransferToggledEvent.OutputObject
    >;
    TransferToggled: TypedContractEvent<
      TransferToggledEvent.InputTuple,
      TransferToggledEvent.OutputTuple,
      TransferToggledEvent.OutputObject
    >;
    'Unpaused(address)': TypedContractEvent<
      UnpausedEvent.InputTuple,
      UnpausedEvent.OutputTuple,
      UnpausedEvent.OutputObject
    >;
    Unpaused: TypedContractEvent<
      UnpausedEvent.InputTuple,
      UnpausedEvent.OutputTuple,
      UnpausedEvent.OutputObject
    >;
  };
}
//# sourceMappingURL=MaskSBT.d.ts.map
