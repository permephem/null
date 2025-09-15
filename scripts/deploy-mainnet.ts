/**
 * Mainnet Deployment Script for Null Protocol
 * Deploys CanonRegistry and MaskSBT contracts to Ethereum Mainnet
 * @author Null Foundation
 */

import hre from 'hardhat';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const { ethers } = hre;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Starting Null Protocol MAINNET deployment...');
  console.log('⚠️  WARNING: This will deploy to Ethereum Mainnet!');
  console.log('💰 Make sure you have sufficient ETH for gas fees');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('📝 Deploying contracts with account:', deployer.address);
  console.log(
    '💰 Account balance:',
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    'ETH'
  );

  // Check if we have enough ETH
  const balance = await ethers.provider.getBalance(deployer.address);
  const minBalance = ethers.parseEther('0.1'); // Minimum 0.1 ETH
  if (balance < minBalance) {
    throw new Error(
      `Insufficient balance. Need at least ${ethers.formatEther(minBalance)} ETH, have ${ethers.formatEther(balance)} ETH`
    );
  }

  // Deploy CanonRegistry
  console.log('\n📋 Deploying CanonRegistry...');
  const CanonRegistry = await ethers.getContractFactory('CanonRegistry');
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
  const MaskSBT = await ethers.getContractFactory('MaskSBT');
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
  console.log('\n🎉 MAINNET Deployment Summary:');
  console.log('=====================================');
  console.log('Network:', await ethers.provider.getNetwork().then((n) => n.name));
  console.log('Chain ID:', (await ethers.provider.getNetwork()).chainId);
  console.log('Deployer:', deployer.address);
  console.log('CanonRegistry:', canonRegistryAddress);
  console.log('MaskSBT:', maskSBTAddress);
  console.log('=====================================');

  // Save deployment info to file
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    contracts: {
      CanonRegistry: canonRegistryAddress,
      MaskSBT: maskSBTAddress,
    },
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    gasUsed: {
      canonRegistry: 'TBD', // Would need to track gas usage
      maskSBT: 'TBD',
    },
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const networkName = network.name;
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentFile}`);

  // Verify contracts on Etherscan
  console.log('\n🔍 Verifying contracts on Etherscan...');
  try {
    await hre.run('verify:verify', {
      address: canonRegistryAddress,
      constructorArguments: [deployer.address, deployer.address, deployer.address],
    });
    console.log('✅ CanonRegistry verified on Etherscan');
  } catch (error) {
    console.log('⚠️  CanonRegistry verification failed:', error);
  }

  try {
    await hre.run('verify:verify', {
      address: maskSBTAddress,
      constructorArguments: ['Null Protocol Mask Receipts', 'NULLMASK', deployer.address],
    });
    console.log('✅ MaskSBT verified on Etherscan');
  } catch (error) {
    console.log('⚠️  MaskSBT verification failed:', error);
  }

  console.log('\n🎯 MAINNET Deployment completed successfully!');
  console.log('📋 Next steps:');
  console.log('1. Update production environment variables');
  console.log('2. Configure production relayer');
  console.log('3. Test contract functionality on mainnet');
  console.log('4. Announce deployment to community');
  console.log('5. Update documentation with mainnet addresses');
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ MAINNET Deployment failed:', error);
    process.exit(1);
  });
