// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ConsumerProtectionPool} from "../contracts/ConsumerProtectionPool.sol";

contract DeployConsumerProtectionPool is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying ConsumerProtectionPool...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        ConsumerProtectionPool pool = new ConsumerProtectionPool();
        
        console.log("ConsumerProtectionPool deployed at:", address(pool));
        console.log("Owner:", pool.owner());

        // Optional: Set initial resolvers if provided in environment
        string memory initialResolvers = vm.envOr("INITIAL_RESOLVERS", string(""));
        if (bytes(initialResolvers).length > 0) {
            // Parse comma-separated addresses and set as resolvers
            string[] memory resolverAddresses = vm.parseStringArray(initialResolvers);
            for (uint256 i = 0; i < resolverAddresses.length; i++) {
                address resolver = vm.parseAddress(resolverAddresses[i]);
                pool.setResolver(resolver, true);
                console.log("Set resolver:", resolver);
            }
        }

        // Optional: Fund the pool if FUND_AMOUNT is provided
        uint256 fundAmount = vm.envOr("FUND_AMOUNT", uint256(0));
        if (fundAmount > 0) {
            (bool success,) = address(pool).call{value: fundAmount}("");
            require(success, "Failed to fund pool");
            console.log("Funded pool with:", fundAmount, "wei");
        }

        vm.stopBroadcast();

        // Save deployment info
        string memory deploymentInfo = string(abi.encodePacked(
            "ConsumerProtectionPool deployed at: ",
            vm.toString(address(pool)),
            "\nOwner: ",
            vm.toString(pool.owner()),
            "\nDeployer: ",
            vm.toString(deployer),
            "\nBlock: ",
            vm.toString(block.number),
            "\nTimestamp: ",
            vm.toString(block.timestamp)
        ));
        
        vm.writeFile("deployments/ConsumerProtectionPool.txt", deploymentInfo);
        console.log("Deployment info saved to deployments/ConsumerProtectionPool.txt");
    }
}
