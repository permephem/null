// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CanonRegistry.sol";
import "../src/MaskSBT.sol";

/**
 * @title Deploy Script for Null Protocol
 * @dev Deploys CanonRegistry and MaskSBT contracts
 * @author Null Foundation
 */
contract DeployScript is Script {
    function run() public returns (CanonRegistry canonRegistry, MaskSBT maskSBT) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy CanonRegistry
        // For simplicity, using deployer as both foundation and implementer treasury
        // In production, these should be separate addresses
        canonRegistry = new CanonRegistry(
            deployer, // foundation treasury
            deployer, // implementer treasury
            deployer // admin
        );

        console.log("CanonRegistry deployed at:", address(canonRegistry));

        // Deploy MaskSBT
        maskSBT = new MaskSBT(
            "Null Protocol Mask Receipts",
            "MASK",
            deployer // admin
        );

        console.log("MaskSBT deployed at:", address(maskSBT));

        // Grant relayer role to deployer (for testing purposes)
        // In production, this should be a separate relayer address
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), deployer);
        maskSBT.grantRole(maskSBT.MINTER_ROLE(), deployer);

        console.log("Roles granted to deployer");

        vm.stopBroadcast();

        console.log("Deployment completed successfully!");
        console.log("CanonRegistry:", address(canonRegistry));
        console.log("MaskSBT:", address(maskSBT));
    }
}
