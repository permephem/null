// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CanonRegistry.sol";
import "../src/MaskSBT.sol";
import "../contracts/ConsumerProtectionPool.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy CanonRegistry
        address foundationTreasury = makeAddr("foundationTreasury");
        address implementerTreasury = makeAddr("implementerTreasury");
        
        CanonRegistry canonRegistry = new CanonRegistry(
            foundationTreasury,
            implementerTreasury,
            deployer
        );
        
        console.log("CanonRegistry deployed at:", address(canonRegistry));

        // Deploy MaskSBT
        MaskSBT maskSBT = new MaskSBT(
            "Null Protocol Mask Receipts",
            "MASK",
            deployer
        );
        
        console.log("MaskSBT deployed at:", address(maskSBT));

        // Deploy ConsumerProtectionPool
        ConsumerProtectionPool consumerPool = new ConsumerProtectionPool();
        
        console.log("ConsumerProtectionPool deployed at:", address(consumerPool));

        // Grant relayer role to deployer
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), deployer);
        console.log("Granted RELAYER_ROLE to deployer");

        // Grant minter role to deployer
        maskSBT.grantRole(maskSBT.MINTER_ROLE(), deployer);
        console.log("Granted MINTER_ROLE to deployer");

        vm.stopBroadcast();

        // Save deployment addresses
        string memory deploymentInfo = string(abi.encodePacked(
            "CanonRegistry: ", vm.toString(address(canonRegistry)), "\n",
            "MaskSBT: ", vm.toString(address(maskSBT)), "\n",
            "ConsumerProtectionPool: ", vm.toString(address(consumerPool)), "\n",
            "Deployer: ", vm.toString(deployer), "\n",
            "Foundation Treasury: ", vm.toString(foundationTreasury), "\n",
            "Implementer Treasury: ", vm.toString(implementerTreasury)
        ));
        
        vm.writeFile("deployment.txt", deploymentInfo);
        console.log("Deployment info saved to deployment.txt");
    }
}



