# Contributing to Null Protocol

Thank you for your interest in contributing to the Null Protocol! This document provides guidelines and information for contributors.

## 🎯 Mission

Null Protocol enables verifiable deletion, auditable closure, and enforceable consent—backed by receipts, not promises. We're building the rights layer for the internet, ensuring that digital deletion is cryptographically verifiable and economically sustainable.

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Code Contributions**: Bug fixes, new features, performance improvements
- **Documentation**: Improving docs, adding examples, fixing typos
- **Testing**: Adding tests, improving test coverage, finding bugs
- **Security**: Security audits, vulnerability reports, hardening
- **Research**: Protocol improvements, cryptographic enhancements
- **Community**: Helping others, answering questions, spreading awareness

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/protocol.git
   cd protocol
   ```
3. **Set up the development environment**:
   ```bash
   npm install
   npm run build
   npm test
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Hardhat (for smart contract development)
- TypeScript knowledge

### Environment Setup

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables**:
   ```bash
   # Ethereum configuration
   ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   RELAYER_PRIVATE_KEY=your_private_key_here
   
   # Contract addresses
   CANON_REGISTRY_ADDRESS=0x...
   MASK_SBT_ADDRESS=0x...
   
   # Security settings
   SBT_MINTING_ENABLED=false
   TRANSFER_ENABLED=false
   ```

3. **Start local blockchain**:
   ```bash
   npm run hardhat:node
   ```

4. **Deploy contracts**:
   ```bash
   npm run deploy:local
   ```

### Development Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
npm run test:contracts
npm run test:relayer
npm run test:integration

# Run linting
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check

# Type checking
npm run type-check

# Start relayer in development mode
npm run relayer:dev

# Start full development environment
npm run dev
```

## 📝 Code Style Guidelines

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow **ESLint** and **Prettier** configurations
- Use **meaningful variable names** and **clear function names**
- Add **JSDoc comments** for public functions
- Prefer **const** over **let**, avoid **var**
- Use **async/await** over **Promises.then()**

### Solidity

- Follow **Solidity Style Guide**
- Use **OpenZeppelin** contracts when possible
- Add **NatSpec comments** for all public functions
- Use **custom errors** instead of require strings
- Implement **reentrancy guards** for state-changing functions
- Use **events** for important state changes

### Security Guidelines

- **Never commit private keys** or sensitive data
- **Validate all inputs** thoroughly
- **Use established cryptographic libraries**
- **Implement proper access controls**
- **Add comprehensive tests** for security-critical functions
- **Follow the principle of least privilege**

## 🧪 Testing

### Test Structure

```
tests/
├── contracts/          # Smart contract tests
├── relayer/           # Relayer system tests
├── integration/       # End-to-end tests
└── security/          # Security-focused tests
```

### Writing Tests

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test component interactions
3. **Security Tests**: Test for vulnerabilities and edge cases
4. **Performance Tests**: Test gas usage and performance

### Test Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:contracts
npm run test:relayer
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run security tests
npm run security:test
```

### Test Coverage

- Aim for **90%+ test coverage**
- Test **happy paths** and **error conditions**
- Test **edge cases** and **boundary conditions**
- Test **security scenarios** and **attack vectors**

## 📋 Pull Request Process

### Before Submitting

1. **Ensure tests pass**:
   ```bash
   npm test
   npm run lint
   npm run format:check
   ```

2. **Update documentation** if needed

3. **Add tests** for new functionality

4. **Update CHANGELOG.md** if applicable

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Security improvement

## Testing
- [ ] Tests pass locally
- [ ] New tests added
- [ ] Security tests pass

## Security Considerations
- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] Access controls reviewed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Security review** for critical changes
4. **Testing** in staging environment
5. **Approval** and merge

## 🔒 Security

### Reporting Security Issues

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, please:

1. **Email security@null.foundation** with details
2. **Use our PGP key** for sensitive information
3. **Include reproduction steps** and **impact assessment**
4. **Allow reasonable time** for response and fix

### Security Best Practices

- **Never commit secrets** (use environment variables)
- **Validate all inputs** from external sources
- **Use established cryptographic libraries**
- **Implement proper access controls**
- **Follow secure coding practices**
- **Regular security audits**

## 📚 Documentation

### Documentation Structure

```
docs/
├── api/               # API documentation
├── security/          # Security guidelines
├── integration/       # Integration guides
├── examples/          # Code examples
└── whitepaper.md      # Technical whitepaper
```

### Writing Documentation

- **Use clear, concise language**
- **Include code examples**
- **Keep documentation up-to-date**
- **Use proper markdown formatting**
- **Add diagrams** for complex concepts

## 🏛️ Governance

### Decision Making

- **Technical decisions** are made by the core team
- **Community input** is welcomed and considered
- **Security decisions** require consensus
- **Breaking changes** require discussion and approval

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- **Be respectful** and **professional**
- **Be inclusive** and **welcoming**
- **Be constructive** in feedback
- **Focus on the issue**, not the person
- **Respect different viewpoints**

## 🎉 Recognition

Contributors will be recognized in:

- **CONTRIBUTORS.md** file
- **Release notes** for significant contributions
- **Community acknowledgments**
- **Foundation recognition** for major contributions

## 📞 Getting Help

### Resources

- **GitHub Issues**: For bugs and feature requests
- **Discord**: For community discussions
- **Email**: For security issues and private matters
- **Documentation**: For technical questions

### Contact Information

- **Website**: https://null.foundation
- **Discord**: https://discord.gg/null-protocol
- **Email**: contact@null.foundation
- **Security**: security@null.foundation

## 📄 License

By contributing to Null Protocol, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to the future of digital rights!**

*"Delete means delete. Not a checkbox, not a policy—a covenant enforced in code."*
