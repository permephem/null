/**
 * Contract Verification Script for Null Protocol
 * Verifies deployed contracts on block explorers
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
  console.log('🔍 Starting contract verification...');

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log('Network:', network.name);
  console.log('Chain ID:', network.chainId);

  // Read deployment info
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  const networkName = network.name;
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error('❌ No deployment file found for network:', networkName);
    console.log('Please deploy contracts first using: npm run deploy:testnet');
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  console.log('📄 Loaded deployment info from:', deploymentFile);

  const { contracts } = deploymentInfo;
  console.log('Contracts to verify:');
  console.log('- CanonRegistry:', contracts.CanonRegistry);
  console.log('- MaskSBT:', contracts.MaskSBT);

  // Verify CanonRegistry
  console.log('\n🔍 Verifying CanonRegistry...');
  try {
    await hre.run('verify:verify', {
      address: contracts.CanonRegistry,
      constructorArguments: [],
    });
    console.log('✅ CanonRegistry verified successfully');
  } catch (error) {
    console.log('⚠️  CanonRegistry verification failed:', error);
  }

  // Verify MaskSBT
  console.log('\n🔍 Verifying MaskSBT...');
  try {
    await hre.run('verify:verify', {
      address: contracts.MaskSBT,
      constructorArguments: ['Null Protocol Mask Receipts', 'NULLMASK'],
    });
    console.log('✅ MaskSBT verified successfully');
  } catch (error) {
    console.log('⚠️  MaskSBT verification failed:', error);
  }

  console.log('\n🎯 Verification completed!');
  console.log('📋 Verified contracts:');
  console.log('- CanonRegistry:', contracts.CanonRegistry);
  console.log('- MaskSBT:', contracts.MaskSBT);
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
