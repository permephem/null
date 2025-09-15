# Null Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?logo=ethereum&logoColor=white)](https://ethereum.org/)

> **Verifiable Digital Closure: The Rights Layer for the Internet**

Null Protocol enables verifiable deletion, auditable closure, and enforceable consent—backed by receipts, not promises. Built on Ethereum with NULL tokens as the currency of absence, the protocol provides cryptographic guarantees of deletion through a dual-layer payment system.

## 🎯 Mission

**"What they take from your data, we take back for you—then prove it."**

Null Protocol ensures that endings are not erasures but commemorations—transformations honored, witnessed, and inscribed into the canon of memory. The protocol integrates decentralized identity systems, zero-knowledge proofs, trusted execution environments, and crypto-shredding to provide cryptographic guarantees of deletion.

## 🏗️ Architecture

The protocol operates through three core components:

- **Null Warrants** - Enforceable deletion commands with security controls
- **Mask Receipts** - Privacy-preserving proof of closure (W3C VCs by default)
- **Canon Ledger** - Append-only registry of closure events and negative registry for data brokers

Coordinated by a **Null Engine** relayer system that mediates between users, enterprises, and blockchain infrastructure.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- Hardhat (for smart contract development)
- TypeScript

### Installation

```bash
# Clone the repository
git clone https://github.com/null-foundation/protocol.git
cd protocol

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Compile smart contracts
npm run compile

# Run tests
npm test

# Start the relayer
npm run relayer:start
```

### Development Setup

```bash
# Install development dependencies
npm install --dev

# Start local blockchain
npm run hardhat:node

# Deploy contracts to local network
npm run deploy:local

# Run linting and formatting
npm run lint
npm run format
```

## 📁 Project Structure

```
null-protocol/
├── contracts/              # Smart contracts
│   ├── CanonRegistry.sol   # Append-only ledger
│   ├── MaskSBT.sol        # Soulbound receipts
│   └── interfaces/        # Contract interfaces
├── relayer/               # Relayer system
│   ├── src/              # TypeScript source
│   ├── api/              # REST API endpoints
│   └── crypto/           # Cryptographic utilities
├── schemas/              # JSON schemas
│   ├── NullWarrant.json  # Warrant schema v0.2
│   ├── DeletionAttestation.json
│   └── MaskReceipt.json
├── docs/                 # Documentation
│   ├── whitepaper.md     # Technical whitepaper
│   ├── api/              # API documentation
│   └── security/         # Security considerations
├── tests/                # Test suites
│   ├── contracts/        # Contract tests
│   ├── relayer/          # Relayer tests
│   └── integration/      # Integration tests
└── scripts/              # Deployment and utility scripts
```

## 🔧 Core Features

### Privacy-Preserving Architecture

- **HMAC-Based Subject Tags** - Prevents correlation attacks
- **W3C Verifiable Credentials** - Default receipt format
- **VOPRF Support** - Negative-registry checks without revealing identity
- **Stealth Address Support** - Optional on-chain proof (EIP-5564)

### Security Hardening

- **Replay Protection** - Unique identifiers and timestamps
- **Gas Optimization** - Hashed fields and pull payment pattern
- **Access Control** - DID doc pinning and key rotation
- **Evidence Standardization** - Structured evidence types

### Enterprise Integration

- **Dual-Layer Payment** - Fiat for enterprises, NULL for settlement
- **Obol Economic Model** - 12/13 to implementer, 1/13 to Foundation
- **Negative Registry** - Data broker compliance checking
- **Transparency Logging** - Rekor-compatible audit trails

## 📚 Documentation

- **[Technical Whitepaper](docs/whitepaper.md)** - Complete technical specification
- **[API Documentation](docs/api/)** - REST API reference
- **[Security Guide](docs/security/)** - Security considerations and hardening
- **[Integration Guide](docs/integration/)** - Enterprise integration patterns
- **[Schema Reference](schemas/)** - JSON schema definitions

## 🛡️ Security

Null Protocol implements comprehensive security measures:

- **Professional Security Audits** - Regular third-party audits
- **Privacy by Design** - HMAC-based subject tags, VOPRF support
- **Replay Protection** - JWT-style security controls
- **Gas Optimization** - Efficient smart contract design
- **Transparency** - Public audit logs and verifiable proofs

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run the test suite (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 Links

- **Website**: https://null.foundation
- **Documentation**: https://null.foundation/docs
- **Discord**: https://discord.gg/null-protocol
- **Twitter**: https://twitter.com/nullprotocol

## 🏛️ Foundation

Null Protocol is developed and maintained by the **Null Foundation**, a Swiss Verein dedicated to digital rights and verifiable deletion. The Foundation operates as a neutral steward, ensuring the protocol remains capture-resistant and aligned with its mission.

### Token Economics

- **NULL Token** - Currency of absence, required for protocol settlement
- **Obol Model** - 1/13 tithe to Foundation for neutral stewardship
- **Dual-Layer Payment** - Enterprises pay fiat, implementers convert to NULL
- **Economic Alignment** - Incentives aligned across users, implementers, and Foundation

## ⚠️ Disclaimer

This software is provided "as is" without warranty of any kind. Use at your own risk. The Null Protocol is experimental software and may contain bugs or vulnerabilities. Always conduct your own security audits before using in production.

---

**Built with ❤️ by the Null Foundation**

_"Delete means delete. Not a checkbox, not a policy—a covenant enforced in code."_
