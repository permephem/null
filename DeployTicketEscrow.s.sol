// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TicketEscrow} from "../contracts/TicketEscrow.sol";
import {ICanonicalRegistry} from "../contracts/ICanonicalRegistry.sol";
import {NullWarrant} from "../contracts/NullWarrant.sol";
import {ConsumerProtectionPool} from "../contracts/ConsumerProtectionPool.sol";

contract DeployTicketEscrow is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying TicketEscrow system...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        // Get contract addresses from environment or use defaults
        address canonRegistry = vm.envOr("CANON_REGISTRY", address(0));
        address warrantRegistry = vm.envOr("WARRANT_REGISTRY", address(0));
        address consumerPool = vm.envOr("CONSUMER_POOL", address(0));
        address foundationTreasury = vm.envOr("FOUNDATION_TREASURY", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy dependencies if not provided
        if (canonRegistry == address(0)) {
            console.log("Deploying MockCanonicalRegistry...");
            // Note: In production, use the real CanonRegistry
            // For now, we'll deploy a mock for testing
            canonRegistry = address(new MockCanonicalRegistry());
            console.log("MockCanonicalRegistry deployed at:", canonRegistry);
        }

        if (warrantRegistry == address(0)) {
            console.log("Deploying NullWarrant...");
            NullWarrant warrant = new NullWarrant(deployer);
            warrantRegistry = address(warrant);
            console.log("NullWarrant deployed at:", warrantRegistry);
        }

        if (consumerPool == address(0)) {
            console.log("Deploying ConsumerProtectionPool...");
            ConsumerProtectionPool pool = new ConsumerProtectionPool();
            consumerPool = address(pool);
            console.log("ConsumerProtectionPool deployed at:", consumerPool);
        }

        // Deploy TicketEscrow
        console.log("Deploying TicketEscrow...");
        TicketEscrow escrow = new TicketEscrow(
            canonRegistry,
            warrantRegistry,
            consumerPool,
            payable(foundationTreasury),
            deployer
        );
        
        console.log("TicketEscrow deployed at:", address(escrow));

        // Set initial confirmers if provided
        string memory initialConfirmers = vm.envOr("INITIAL_CONFIRMERS", string(""));
        if (bytes(initialConfirmers).length > 0) {
            string[] memory confirmerAddresses = vm.parseStringArray(initialConfirmers);
            for (uint256 i = 0; i < confirmerAddresses.length; i++) {
                address confirmer = vm.parseAddress(confirmerAddresses[i]);
                escrow.setConfirmer(confirmer, true);
                console.log("Set confirmer:", confirmer);
            }
        }

        // Set custom fees if provided
        uint16 obolBps = uint16(vm.envOr("OBOL_BPS", uint256(769))); // 7.69%
        uint16 protectBps = uint16(vm.envOr("PROTECT_BPS", uint256(50))); // 0.5%
        
        if (obolBps != 769 || protectBps != 50) {
            escrow.setFees(obolBps, protectBps, payable(foundationTreasury));
            console.log("Set fees - Obol:", obolBps, "bps, Protect:", protectBps, "bps");
        }

        vm.stopBroadcast();

        // Save deployment info
        string memory deploymentInfo = string(abi.encodePacked(
            "TicketEscrow deployed at: ",
            vm.toString(address(escrow)),
            "\nCanonRegistry: ",
            vm.toString(canonRegistry),
            "\nNullWarrant: ",
            vm.toString(warrantRegistry),
            "\nConsumerProtectionPool: ",
            vm.toString(consumerPool),
            "\nFoundation Treasury: ",
            vm.toString(foundationTreasury),
            "\nOwner: ",
            vm.toString(deployer),
            "\nBlock: ",
            vm.toString(block.number),
            "\nTimestamp: ",
            vm.toString(block.timestamp)
        ));
        
        vm.writeFile("deployments/TicketEscrow.txt", deploymentInfo);
        console.log("Deployment info saved to deployments/TicketEscrow.txt");
    }
}

// Mock Canonical Registry for testing
contract MockCanonicalRegistry is ICanonicalRegistry {
    mapping(bytes32 => bool) public anchored;
    
    function anchorTickets(
        bytes32 ticketCommit,
        bytes32 eventCommit,
        bytes32 holderCommit,
        bytes32 policyCommit,
        uint8 assurance,
        string calldata uri,
        uint256 feeWei
    ) external payable returns (bytes32) {
        anchored[ticketCommit] = true;
        return keccak256(abi.encodePacked(ticketCommit, block.timestamp));
    }
    
    function isAnchored(bytes32 ticketCommit) external view returns (bool) {
        return anchored[ticketCommit];
    }
    
    function getTicket(bytes32 ticketCommit) external view returns (
        bytes32 eventCommit,
        bytes32 holderCommit,
        bytes32 policyCommit,
        uint8 assurance,
        string memory uri
    ) {
        return (bytes32(0), bytes32(0), bytes32(0), 1, "ipfs://test");
    }
}
