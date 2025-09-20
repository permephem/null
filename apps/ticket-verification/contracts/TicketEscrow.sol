// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ICanonicalRegistry} from "./ICanonicalRegistry.sol";
import {NullWarrant} from "./NullWarrant.sol";
import {ConsumerProtectionPool} from "./ConsumerProtectionPool.sol";

/// @notice Canon-native escrow for primary and secondary sales.
/// Funds flow: Buyer -> Escrow -> (after Canon inscription) -> Seller/Venue
/// Fees: Obol/foundation + protection-pool micro-levy.
/// If a sale is later revoked as fraudulent, a resolver can trigger a buyer refund
/// from the protection pool; the bad seller is blacklisted off-chain + in Canon.
contract TicketEscrow is ReentrancyGuard, Ownable {
    struct Order {
        // Deterministic sale id: saleId = keccak256(abi.encode(order fields))
        bytes32 saleId;
        bytes32 ticketCommit;    // commitment to ticket id (bytes32)
        address payable seller;  // venue or rightful owner
        address payable buyer;   // buyer address
        uint96  price;           // wei (supports up to ~79 ETH safely within 96 bits)
        uint32  expiry;          // unix time: order must finalize before this
        uint32  maxPctCap;       // e.g., 110 = 110% price cap (optional, off-chain enforced too)
    }

    enum State { None, Funded, Settled, Refunded, Cancelled }
    mapping(bytes32 => State) public saleState;      // saleId -> state
    mapping(bytes32 => uint256) public escrowedAmt;  // saleId -> wei
    mapping(bytes32 => address) public saleBuyer;    // saleId -> buyer (final)

    // External systems
    ICanonicalRegistry public immutable canon;
    NullWarrant public immutable warrant;
    ConsumerProtectionPool public immutable cpp;

    // Fee parameters (basis points: 10000 = 100%)
    uint16 public obolBps = 769;        // 1/13 ~= 7.6923% (example; tune for tickets)
    uint16 public protectBps = 50;      // 0.50% to CPP (example)
    address payable public foundation;  // foundation treasury

    // Relayer/venue ops allowed to confirm Canon inscription
    mapping(address => bool) public isConfirmer;

    event Funded(bytes32 indexed saleId, address indexed buyer, uint256 amount);
    event Settled(bytes32 indexed saleId, address indexed seller, uint256 netProceeds, string canonUri);
    event Refunded(bytes32 indexed saleId, address indexed buyer, uint256 amount, string reason);
    event Cancelled(bytes32 indexed saleId, address indexed buyer);
    event ConfirmerSet(address indexed who, bool allowed);
    event FeesUpdated(uint16 obolBps, uint16 protectBps, address foundation);

    constructor(
        address canonRegistry,
        address warrantRegistry,
        address consumerPool,
        address payable foundationTreasury,
        address admin
    ) {
        canon = ICanonicalRegistry(canonRegistry);
        warrant = NullWarrant(warrantRegistry);
        cpp = ConsumerProtectionPool(payable(consumerPool));
        foundation = foundationTreasury;
        _transferOwnership(admin);
        isConfirmer[admin] = true;
    }

    // -------- Admin --------
    function setConfirmer(address who, bool allowed) external onlyOwner {
        isConfirmer[who] = allowed;
        emit ConfirmerSet(who, allowed);
    }

    function setFees(uint16 _obolBps, uint16 _protectBps, address payable _foundation) external onlyOwner {
        require(_obolBps + _protectBps <= 2000, "fees too high"); // guardrail: <=20% total
        obolBps = _obolBps;
        protectBps = _protectBps;
        foundation = _foundation;
        emit FeesUpdated(_obolBps, _protectBps, _foundation);
    }

    // -------- Buyer path --------

    /// @notice Buyer funds escrow for a specific order (primary or resale).
    /// @dev In production, you'd verify a seller-signed EIP-712 order off-chain and pass the hash here.
    function fund(Order calldata o) external payable nonReentrant {
        require(block.timestamp <= o.expiry, "expired");
        require(saleState[o.saleId] == State.None, "exists");
        require(msg.value == o.price, "bad amount");

        saleState[o.saleId] = State.Funded;
        escrowedAmt[o.saleId] = msg.value;
        saleBuyer[o.saleId] = msg.sender; // lock buyer identity for this sale

        emit Funded(o.saleId, msg.sender, msg.value);
    }

    /// @notice Cancel before settlement if seller didn't deliver in time (simple L1 timeout model).
    function cancel(Order calldata o) external nonReentrant {
        require(saleState[o.saleId] == State.Funded, "not funded");
        require(saleBuyer[o.saleId] == msg.sender, "not buyer");
        require(block.timestamp > o.expiry, "not yet");

        saleState[o.saleId] = State.Cancelled;
        uint256 amt = escrowedAmt[o.saleId];
        delete escrowedAmt[o.saleId];

        (bool ok, ) = payable(msg.sender).call{value: amt}("");
        require(ok, "refund failed");
        emit Cancelled(o.saleId, msg.sender);
    }

    // -------- Settlement path (called by relayer/venue ops) --------

    /// @notice Confirm Canon inscription & settle proceeds. Consumer is protected because funds
    /// remain in escrow until Canon anchor is final.
    /// @param o          original order
    /// @param canonUri   evidence pointer inscribed by relayer (ipfs://...)
    function confirmAndSettle(Order calldata o, string calldata canonUri)
        external
        nonReentrant
    {
        require(isConfirmer[msg.sender], "not confirmer");
        require(saleState[o.saleId] == State.Funded, "bad state");
        require(saleBuyer[o.saleId] == o.buyer, "buyer mismatch");
        require(!warrant.isRevoked(o.ticketCommit), "revoked");

        // --- fee splits
        uint256 gross = escrowedAmt[o.saleId];
        uint256 obol = (gross * obolBps) / 10000;
        uint256 protect = (gross * protectBps) / 10000;
        uint256 net = gross - obol - protect;

        saleState[o.saleId] = State.Settled;
        delete escrowedAmt[o.saleId];

        // Payouts
        (bool ok1, ) = foundation.call{value: obol}("");
        require(ok1, "obol fail");

        (bool ok2, ) = payable(address(cpp)).call{value: protect}("");
        require(ok2, "cpp fail");

        (bool ok3, ) = o.seller.call{value: net}("");
        require(ok3, "seller pay fail");

        emit Settled(o.saleId, o.seller, net, canonUri);
        // Note: the relayer should have already inscribed Canon before calling this
        // (or do it right after with canonical proofs). You can also enforce a
        // Canon anchor callback pattern if you run L2 where callbacks are easy.
    }

    // -------- Emergency consumer make-whole --------

    /// @notice If a settled sale later becomes invalid (e.g., ticket revoked),
    /// a resolver can trigger a buyer refund from the protection pool.
    /// The bad seller is handled off-chain (blacklist, law-enforcement, etc).
    function refundFromPool(
        Order calldata o,
        string calldata reason
    ) external nonReentrant {
        require(isConfirmer[msg.sender], "not confirmer"); // trusted operator / DAO executor
        require(saleState[o.saleId] == State.Settled, "not settled");
        // Use the original gross price (or policy-defined cap) as refund
        cpp.refundBuyer(o.saleId, o.buyer, o.price, reason);
        // Optional: mark state to block duplicate human ops; pool already prevents double-refund.
        saleState[o.saleId] = State.Refunded;
        emit Refunded(o.saleId, o.buyer, o.price, reason);
    }

    // -------- Utilities --------

    /// @notice Precompute a saleId deterministically off-chain to avoid collisions.
    function computeSaleId(Order calldata o) external pure returns (bytes32) {
        return keccak256(abi.encode(
            o.ticketCommit, o.seller, o.buyer, o.price, o.expiry, o.maxPctCap
        ));
    }
}
