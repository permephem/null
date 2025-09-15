/**
 * Deployment Script for Null Protocol
 * Deploys CanonRegistry and MaskSBT contracts
 * @author Null Foundation
 */

import hre from 'hardhat';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Starting Null Protocol deployment...');

  // Get the deployer account
  const [deployer] = await (hre as any).ethers.getSigners();
  console.log('📝 Deploying contracts with account:', deployer.address);
  console.log(
    '💰 Account balance:',
    (hre as any).ethers.formatEther(
      await (hre as any).ethers.provider.getBalance(deployer.address)
    ),
    'ETH'
  );

  // Deploy CanonRegistry
  console.log('\n📋 Deploying CanonRegistry...');
  const CanonRegistry = await (hre as any).ethers.getContractFactory('CanonRegistry');
  const canonRegistry = await CanonRegistry.deploy(
    deployer.address, // foundationTreasury
    deployer.address, // implementerTreasury
    deployer.address // admin
  );
  await canonRegistry.waitForDeployment();
  const canonRegistryAddress = await canonRegistry.getAddress();
  console.log('✅ CanonRegistry deployed to:', canonRegistryAddress);

  // Deploy MaskSBT
  console.log('\n🎭 Deploying MaskSBT...');
  const MaskSBT = await (hre as any).ethers.getContractFactory('MaskSBT');
  const maskSBT = await MaskSBT.deploy('Null Protocol Mask Receipts', 'NULLMASK', deployer.address);
  await maskSBT.waitForDeployment();
  const maskSBTAddress = await maskSBT.getAddress();
  console.log('✅ MaskSBT deployed to:', maskSBTAddress);

  // Grant MINTER_ROLE to CanonRegistry for MaskSBT
  console.log('\n🔐 Setting up permissions...');
  const MINTER_ROLE = await maskSBT.MINTER_ROLE();
  await maskSBT.grantRole(MINTER_ROLE, canonRegistryAddress);
  console.log('✅ Granted MINTER_ROLE to CanonRegistry');

  // Enable SBT minting
  await maskSBT.toggleSBTMinting(true);
  console.log('✅ Enabled SBT minting');

  // Output deployment summary
  console.log('\n🎉 Deployment Summary:');
  console.log('=====================================');
  console.log('Network:', await (hre as any).ethers.provider.getNetwork().then((n: any) => n.name));
  console.log('Chain ID:', (await (hre as any).ethers.provider.getNetwork()).chainId);
  console.log('Deployer:', deployer.address);
  console.log('CanonRegistry:', canonRegistryAddress);
  console.log('MaskSBT:', maskSBTAddress);
  console.log('=====================================');

  // Save deployment info to file
  const network = await (hre as any).ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    contracts: {
      CanonRegistry: canonRegistryAddress,
      MaskSBT: maskSBTAddress,
    },
    timestamp: new Date().toISOString(),
    blockNumber: await (hre as any).ethers.provider.getBlockNumber(),
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const networkName = network.name;
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentFile}`);

  // Verify contracts if on a supported network
  if (network.chainId === 84532n || network.chainId === 8453n) {
    // Base Sepolia or Base Mainnet
    console.log('\n🔍 Verifying contracts on block explorer...');
    try {
      await hre.run('verify:verify', {
        address: canonRegistryAddress,
        constructorArguments: [deployer.address, deployer.address, deployer.address],
      });
      console.log('✅ CanonRegistry verified');
    } catch (error) {
      console.log('⚠️  CanonRegistry verification failed:', error);
    }

    try {
      await hre.run('verify:verify', {
        address: maskSBTAddress,
        constructorArguments: ['Null Protocol Mask Receipts', 'NULLMASK', deployer.address],
      });
      console.log('✅ MaskSBT verified');
    } catch (error) {
      console.log('⚠️  MaskSBT verification failed:', error);
    }
  }

  console.log('\n🎯 Deployment completed successfully!');
  console.log('📋 Next steps:');
  console.log('1. Update environment variables with contract addresses');
  console.log('2. Configure relayer with new contract addresses');
  console.log('3. Test contract functionality');
  console.log('4. Update documentation with deployment info');
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
