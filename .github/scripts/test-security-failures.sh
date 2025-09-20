#!/bin/bash

# Test script to verify that security failures properly break the build
echo "Testing security failure detection..."

# Test 1: Simulate Snyk vulnerability detection
echo "Test 1: Snyk vulnerability detection"
cat > test-snyk-vulnerability.json << 'EOF'
{
  "vulnerabilities": [
    {
      "id": "SNYK-JS-TEST-123456",
      "severity": "high",
      "packageName": "test-package",
      "title": "Test High Severity Vulnerability",
      "description": "This is a test vulnerability",
      "isDevDependency": false,
      "isOptional": false
    }
  ]
}
EOF

echo "Running Snyk verification with test vulnerability..."
if node .github/scripts/verify-snyk.js test-snyk-vulnerability.json .github/security/snyk-allowlist.json; then
    echo "❌ FAILED: Snyk verification should have failed but didn't"
    exit 1
else
    echo "✅ PASSED: Snyk verification correctly failed on high-severity vulnerability"
fi

# Test 2: Simulate allowed vulnerability
echo "Test 2: Allowed vulnerability"
cat > test-snyk-allowed.json << 'EOF'
{
  "vulnerabilities": [
    {
      "id": "SNYK-JS-LODASH-567746",
      "severity": "high",
      "packageName": "lodash",
      "title": "Lodash vulnerability",
      "description": "This is an allowed vulnerability",
      "isDevDependency": false,
      "isOptional": false
    }
  ]
}
EOF

echo "Running Snyk verification with allowed vulnerability..."
if node .github/scripts/verify-snyk.js test-snyk-allowed.json .github/security/snyk-allowlist.json; then
    echo "✅ PASSED: Snyk verification correctly allowed the allowlisted vulnerability"
else
    echo "❌ FAILED: Snyk verification should have allowed the vulnerability but failed"
    exit 1
fi

# Test 3: Simulate Slither vulnerability detection
echo "Test 3: Slither vulnerability detection"
cat > test-slither-vulnerability.json << 'EOF'
{
  "results": {
    "detectors": [
      {
        "check": "reentrancy-eth",
        "impact": "High",
        "description": "Reentrancy vulnerability detected",
        "elements": [
          {
            "type": "function",
            "name": "withdraw",
            "contract": "TestContract"
          }
        ]
      }
    ]
  }
}
EOF

echo "Running Slither verification with test vulnerability..."
if node .github/scripts/verify-slither.js test-slither-vulnerability.json .github/security/slither-allowlist.json 0; then
    echo "❌ FAILED: Slither verification should have failed but didn't"
    exit 1
else
    echo "✅ PASSED: Slither verification correctly failed on high-severity finding"
fi

# Clean up test files
rm -f test-snyk-vulnerability.json test-snyk-allowed.json test-slither-vulnerability.json

echo ""
echo "✅ All security failure detection tests passed!"
echo "Security workflows will now properly fail the build when vulnerabilities are detected."


