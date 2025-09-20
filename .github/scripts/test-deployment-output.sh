#!/bin/bash

# Test script to verify contract address extraction from deployment output
# This simulates the output format from the Deploy.s.sol script

echo "Testing contract address extraction..."

# Simulate deployment output (similar to what forge script would produce)
cat > test-deployment-output.txt << 'EOF'
Deploying contracts with deployer: 0x1234567890123456789012345678901234567890
Deployer balance: 1000000000000000000
CanonRegistry deployed at: 0x1111111111111111111111111111111111111111
MaskSBT deployed at: 0x2222222222222222222222222222222222222222
Roles granted to deployer
Deployment completed successfully!
CanonRegistry: 0x1111111111111111111111111111111111111111
MaskSBT: 0x2222222222222222222222222222222222222222
EOF

echo "Simulated deployment output:"
cat test-deployment-output.txt

echo ""
echo "Extracting contract addresses..."

# Extract contract addresses using the same logic as in the workflow
CANON_REGISTRY=$(grep "CanonRegistry:" test-deployment-output.txt | tail -1 | awk '{print $2}')
MASK_SBT=$(grep "MaskSBT:" test-deployment-output.txt | tail -1 | awk '{print $2}')

echo "Extracted addresses:"
echo "CanonRegistry: $CANON_REGISTRY"
echo "MaskSBT: $MASK_SBT"

# Validate addresses
if [[ -z "$CANON_REGISTRY" || -z "$MASK_SBT" ]]; then
    echo "❌ Failed to extract contract addresses"
    exit 1
fi

# Check if addresses look like valid Ethereum addresses
if [[ ! "$CANON_REGISTRY" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "❌ CanonRegistry address format is invalid: $CANON_REGISTRY"
    exit 1
fi

if [[ ! "$MASK_SBT" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "❌ MaskSBT address format is invalid: $MASK_SBT"
    exit 1
fi

echo "✅ Contract address extraction test passed!"
echo "✅ Both addresses are valid Ethereum addresses"

# Clean up
rm test-deployment-output.txt

echo ""
echo "Test completed successfully. The deployment workflow should work correctly."


