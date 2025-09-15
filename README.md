# Null Protocol

**Verifiable Digital Closure: The Rights Layer for the Internet**

The Null Protocol enables verifiable deletion of personal data through cryptographic proofs anchored on Ethereum. It provides a standardized way for individuals to request data deletion from enterprises and receive immutable proof that their data has been removed.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
git clone https://github.com/null-foundation/protocol.git
cd protocol
npm install
cp env.example .env
# Fill in ETHEREUM_RPC_URL, RELAYER_PRIVATE_KEY, CANON_REGISTRY_ADDRESS, etc.
```

### Environment Configuration

Edit `.env` with your configuration:

```bash
# Ethereum Configuration
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
RELAYER_PRIVATE_KEY=your_private_key_here

# Contract Addresses (will be set after deployment)
CANON_REGISTRY_ADDRESS=0x...
MASK_SBT_ADDRESS=0x...

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
```

## 🏗️ Compile and Deploy Contracts

### Local Development

```bash
npm run hardhat:node           # Start local chain
npm run deploy:local           # Deploy CanonRegistry + MaskSBT locally
# Update .env with the deployed contract addresses
```

### Testnet/Mainnet Deployment

```bash
# For testnet deployment
npm run deploy:testnet

# For mainnet deployment  
npm run deploy:mainnet

# Update .env with the deployed contract addresses
```

## 🔄 Start the Relayer

```bash
npm run relayer:start          # Launches Express server on PORT (default 3000)
# or: npm run dev              # Runs hardhat node + relayer concurrently
```

## 📡 REST API Usage

### Health Check

```bash
curl http://localhost:3000/health
```

### Submit a Warrant

```bash
curl -X POST http://localhost:3000/api/v1/warrants \
  -H "Content-Type: application/json" \
  -d '{
    "type": "NullWarrant@v0.2",
    "warrant_id": "warrant_123",
    "enterprise_id": "enterprise_456",
    "subject": {
      "subject_handle": "did:example:subject"
    },
    "scope": ["personal_data"],
    "jurisdiction": "US",
    "legal_basis": "GDPR",
    "issued_at": "2024-01-01T00:00:00Z",
    "expires_at": "2024-01-02T00:00:00Z",
    "return_channels": ["email"],
    "nonce": "random_nonce_123",
    "signature": {
      "alg": "EdDSA",
      "kid": "key_id_123",
      "sig": "signature_here"
    },
    "aud": "controller_did",
    "jti": "unique_jti_123",
    "nbf": 1704067200,
    "exp": 1704153600,
    "audience_bindings": ["enterprise.com"],
    "version": "v0.2",
    "evidence_requested": ["API_LOG"],
    "sla_seconds": 3600
  }'
```

### Submit an Attestation

```bash
curl -X POST http://localhost:3000/api/v1/attestations \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DeletionAttestation@v0.2",
    "attestation_id": "attestation_789",
    "warrant_id": "warrant_123",
    "enterprise_id": "enterprise_456",
    "subject_handle": "did:example:subject",
    "status": "deleted",
    "completed_at": "2024-01-01T12:00:00Z",
    "evidence_hash": "evidence_hash_123",
    "signature": {
      "alg": "EdDSA",
      "kid": "key_id_456",
      "sig": "signature_here"
    },
    "aud": "engine_did",
    "ref": "unique_jti_123",
    "processing_window": 3600,
    "accepted_claims": ["US"],
    "controller_policy_digest": "policy_hash_123"
  }'
```

### Check Processing Status

```bash
curl http://localhost:3000/api/v1/status/<request_id>
```

## 🔧 Direct Contract Interaction (Optional)

```bash
npx hardhat console --network localhost
```

```javascript
const canon = await ethers.getContractAt("CanonRegistry", "<CanonRegistryAddress>")
await canon.anchorWarrant(/* digest, subjectTag, ... */)

const maskSBT = await ethers.getContractAt("MaskSBT", "<MaskSBTAddress>")
await maskSBT.mintReceipt(/* recipient, receiptHash */)
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run contract tests only
npm run test:contracts

# Run relayer tests only
npm run test:relayer

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## 📚 Documentation

- **[Technical Whitepaper](docs/whitepaper.md)** - Complete protocol specification
- **[Technical Considerations](docs/technical-considerations.md)** - Implementation details and ICO analysis
- **[Manifesto](docs/manifesto.txt)** - Protocol philosophy and vision
- **[API Documentation](docs/api/)** - REST API reference
- **[Integration Examples](docs/examples/)** - Usage examples and tutorials

## 🏛️ Architecture

The Null Protocol consists of several key components:

### Smart Contracts
- **CanonRegistry**: Append-only ledger for anchoring deletion events
- **MaskSBT**: Soulbound tokens representing immutable proof of deletion

### Relayer System
- **API Layer**: REST endpoints for warrant/attestation submission
- **Validation**: Schema validation and cryptographic verification
- **Blockchain Integration**: Contract interaction and transaction management
- **Storage**: WORM storage for full artifacts

### Cryptographic Primitives
- **HMAC-Blake3**: Privacy-preserving subject tag generation
- **Ed25519/Secp256k1**: Digital signature verification
- **JWS/DID**: Decentralized identity integration
- **Canonical JSON**: Consistent data serialization

## 🔒 Security Features

- **Privacy-Preserving**: HMAC-based subject tags prevent identity correlation
- **Cryptographic Proofs**: All operations cryptographically signed and verified
- **Replay Protection**: Nonce-based protection against replay attacks
- **Access Control**: Role-based permissions for all contract functions
- **Pausable Operations**: Emergency stop functionality for critical functions

## 🌐 Network Support

- **Ethereum Mainnet**: Production deployment
- **Base**: Layer 2 scaling solution
- **Sepolia**: Ethereum testnet
- **Base Sepolia**: Base testnet
- **Local Hardhat**: Development environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: Report bugs and request features via [GitHub Issues](https://github.com/null-foundation/protocol/issues)
- **Discussions**: Join community discussions in [GitHub Discussions](https://github.com/null-foundation/protocol/discussions)

## 🎯 Next Steps

1. **Study the documentation**: Read `docs/whitepaper.md` and `docs/technical-considerations.md` for protocol rationale
2. **Replace placeholder implementations**: Update `relayer/src/crypto` and `relayer/src/canon` with production implementations
3. **Expand test coverage**: Add more tests under `tests/` as new features are developed
4. **Deploy to testnet**: Test the protocol on Base Sepolia or Ethereum Sepolia
5. **Contribute**: Help improve the protocol by contributing code, documentation, or feedback

Following these steps lets you run a local or testnet instance, submit deletion warrants/attestations, and observe on-chain anchoring and receipt generation.

---

**The Null Protocol**: *Where data goes to die, verifiably.*