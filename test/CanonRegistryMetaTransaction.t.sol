// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/CanonRegistry.sol";

/**
 * @title CanonRegistry Meta-Transaction Tests
 * @dev Tests EIP-712 meta-transaction support for gasless relayer anchoring
 * @author Null Foundation
 */
contract CanonRegistryMetaTransactionTest is Test {
    CanonRegistry public canonRegistry;
    address public owner;
    address public relayer;
    address public foundationTreasury;
    address public implementerTreasury;
    address public metaTxExecutor;

    // Test data
    bytes32 public warrantDigest = keccak256("test-warrant");
    bytes32 public attestationDigest = keccak256("test-attestation");
    bytes32 public subjectTag = keccak256("test-subject");
    bytes32 public controllerDidHash = keccak256("test-controller");
    uint8 public assurance = 1;

    function setUp() public {
        owner = makeAddr("owner");
        relayer = makeAddr("relayer");
        foundationTreasury = makeAddr("foundationTreasury");
        implementerTreasury = makeAddr("implementerTreasury");
        metaTxExecutor = makeAddr("metaTxExecutor");

        vm.startPrank(owner);
        canonRegistry = new CanonRegistry(foundationTreasury, implementerTreasury, owner);
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), relayer);
        vm.stopPrank();
    }

    function testMetaTransactionAnchoring() public {
        uint256 deadline = block.timestamp + 3600; // 1 hour from now
        uint256 nonce = canonRegistry.getNonce(metaTxExecutor);

        // Create EIP-712 signature
        bytes32 structHash = keccak256(
            abi.encode(
                canonRegistry.ANCHOR_TYPEHASH(),
                warrantDigest,
                attestationDigest,
                subjectTag,
                controllerDidHash,
                assurance,
                nonce,
                deadline
            )
        );

        bytes32 digest = canonRegistry.getDomainSeparator();
        digest = keccak256(abi.encodePacked("\x19\x01", digest, structHash));

        // Sign with relayer's private key (the actual relayer who has the role)
        uint256 relayerPrivateKey = 0x1234567890123456789012345678901234567890123456789012345678901234;
        address relayerSigner = vm.addr(relayerPrivateKey);
        
        // Make sure the signer has the relayer role
        vm.startPrank(owner);
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), relayerSigner);
        vm.stopPrank();
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(relayerPrivateKey, digest);

        // Fund the executor for gas and fees
        vm.deal(metaTxExecutor, 1 ether);

        // Execute meta-transaction
        vm.startPrank(metaTxExecutor);
        canonRegistry.anchorMeta{value: canonRegistry.baseFee()}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance,
            deadline,
            v,
            r,
            s
        );
        vm.stopPrank();

        // Verify the anchor was recorded
        assertTrue(canonRegistry.isAnchored(warrantDigest));
        assertTrue(canonRegistry.isAnchored(attestationDigest));
        assertEq(canonRegistry.totalAnchors(), 1);
        assertEq(canonRegistry.totalFeesCollected(), canonRegistry.baseFee());
    }

    function testMetaTransactionExpired() public {
        uint256 deadline = block.timestamp - 1; // Already expired
        uint256 nonce = canonRegistry.getNonce(metaTxExecutor);

        // Create signature (will be valid but expired)
        bytes32 structHash = keccak256(
            abi.encode(
                canonRegistry.ANCHOR_TYPEHASH(),
                warrantDigest,
                attestationDigest,
                subjectTag,
                controllerDidHash,
                assurance,
                nonce,
                deadline
            )
        );

        bytes32 digest = canonRegistry.getDomainSeparator();
        digest = keccak256(abi.encodePacked("\x19\x01", digest, structHash));

        uint256 relayerPrivateKey = 0x1234567890123456789012345678901234567890123456789012345678901234;
        address relayerSigner = vm.addr(relayerPrivateKey);
        
        // Make sure the signer has the relayer role
        vm.startPrank(owner);
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), relayerSigner);
        vm.stopPrank();
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(relayerPrivateKey, digest);

        vm.deal(metaTxExecutor, 1 ether);

        // Should revert due to expired deadline
        vm.startPrank(metaTxExecutor);
        vm.expectRevert("Meta-transaction expired");
        canonRegistry.anchorMeta{value: canonRegistry.baseFee()}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance,
            deadline,
            v,
            r,
            s
        );
        vm.stopPrank();
    }

    function testMetaTransactionInvalidSignature() public {
        uint256 deadline = block.timestamp + 3600;
        uint256 nonce = canonRegistry.getNonce(metaTxExecutor);

        // Create signature with wrong private key
        bytes32 structHash = keccak256(
            abi.encode(
                canonRegistry.ANCHOR_TYPEHASH(),
                warrantDigest,
                attestationDigest,
                subjectTag,
                controllerDidHash,
                assurance,
                nonce,
                deadline
            )
        );

        bytes32 digest = canonRegistry.getDomainSeparator();
        digest = keccak256(abi.encodePacked("\x19\x01", digest, structHash));

        // Sign with wrong private key (not a relayer)
        uint256 wrongPrivateKey = 0x9876543210987654321098765432109876543210987654321098765432109876;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPrivateKey, digest);

        vm.deal(metaTxExecutor, 1 ether);

        // Should revert due to invalid relayer signature
        vm.startPrank(metaTxExecutor);
        vm.expectRevert("Invalid relayer signature");
        canonRegistry.anchorMeta{value: canonRegistry.baseFee()}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance,
            deadline,
            v,
            r,
            s
        );
        vm.stopPrank();
    }

    function testAssuranceTierPolicies() public {
        // Test EMAIL_DKIM (0)
        string memory policy0 = canonRegistry.getAssuranceTierPolicy(0);
        assertEq(policy0, "EMAIL_DKIM: Email DKIM verification");

        // Test DID_JWS (1)
        string memory policy1 = canonRegistry.getAssuranceTierPolicy(1);
        assertEq(policy1, "DID_JWS: DID JWS signature verification");

        // Test TEE_ATTESTATION (2)
        string memory policy2 = canonRegistry.getAssuranceTierPolicy(2);
        assertEq(policy2, "TEE_ATTESTATION: Trusted Execution Environment attestation");

        // Test invalid tier
        string memory policyInvalid = canonRegistry.getAssuranceTierPolicy(3);
        assertEq(policyInvalid, "INVALID: Unknown assurance tier");
    }

    function testNonceIncrement() public {
        uint256 initialNonce = canonRegistry.getNonce(metaTxExecutor);
        assertEq(initialNonce, 0);

        // Execute a meta-transaction
        uint256 deadline = block.timestamp + 3600;
        uint256 nonce = canonRegistry.getNonce(metaTxExecutor);

        bytes32 structHash = keccak256(
            abi.encode(
                canonRegistry.ANCHOR_TYPEHASH(),
                warrantDigest,
                attestationDigest,
                subjectTag,
                controllerDidHash,
                assurance,
                nonce,
                deadline
            )
        );

        bytes32 digest = canonRegistry.getDomainSeparator();
        digest = keccak256(abi.encodePacked("\x19\x01", digest, structHash));

        uint256 relayerPrivateKey = 0x1234567890123456789012345678901234567890123456789012345678901234;
        address relayerSigner = vm.addr(relayerPrivateKey);
        
        // Make sure the signer has the relayer role
        vm.startPrank(owner);
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), relayerSigner);
        vm.stopPrank();
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(relayerPrivateKey, digest);

        vm.deal(metaTxExecutor, 1 ether);

        vm.startPrank(metaTxExecutor);
        canonRegistry.anchorMeta{value: canonRegistry.baseFee()}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance,
            deadline,
            v,
            r,
            s
        );
        vm.stopPrank();

        // Check that nonce was incremented
        uint256 finalNonce = canonRegistry.getNonce(metaTxExecutor);
        assertEq(finalNonce, initialNonce + 1);
    }

    function testDomainSeparator() public {
        bytes32 domainSeparator = canonRegistry.getDomainSeparator();
        assertTrue(domainSeparator != bytes32(0));
        
        // Domain separator should be consistent
        bytes32 domainSeparator2 = canonRegistry.getDomainSeparator();
        assertEq(domainSeparator, domainSeparator2);
    }

    function testMetaTransactionReplayProtection() public {
        uint256 deadline = block.timestamp + 3600;
        uint256 nonce = canonRegistry.getNonce(metaTxExecutor);

        // Create signature
        bytes32 structHash = keccak256(
            abi.encode(
                canonRegistry.ANCHOR_TYPEHASH(),
                warrantDigest,
                attestationDigest,
                subjectTag,
                controllerDidHash,
                assurance,
                nonce,
                deadline
            )
        );

        bytes32 digest = canonRegistry.getDomainSeparator();
        digest = keccak256(abi.encodePacked("\x19\x01", digest, structHash));

        uint256 relayerPrivateKey = 0x1234567890123456789012345678901234567890123456789012345678901234;
        address relayerSigner = vm.addr(relayerPrivateKey);
        
        // Make sure the signer has the relayer role
        vm.startPrank(owner);
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), relayerSigner);
        vm.stopPrank();
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(relayerPrivateKey, digest);

        vm.deal(metaTxExecutor, 2 ether);

        // Execute first meta-transaction
        vm.startPrank(metaTxExecutor);
        canonRegistry.anchorMeta{value: canonRegistry.baseFee()}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance,
            deadline,
            v,
            r,
            s
        );
        vm.stopPrank();

        // Try to execute the same meta-transaction again (should fail due to nonce)
        vm.startPrank(metaTxExecutor);
        vm.expectRevert(); // ECDSA.recover will fail due to nonce mismatch
        canonRegistry.anchorMeta{value: canonRegistry.baseFee()}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance,
            deadline,
            v,
            r,
            s
        );
        vm.stopPrank();
    }
}
