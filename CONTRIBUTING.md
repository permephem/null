# Contributing to Null Protocol

Thank you for your interest in contributing to the Null Protocol! This document provides guidelines and information for contributors.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@null.xyz.

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git
- Foundry (for smart contract development)

### Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/null-protocol.git
   cd null-protocol
   ```

2. **Install dependencies:**
   ```bash
   npm install --workspaces
   ```

3. **Start the development stack:**
   ```bash
   make up
   ```

4. **Run tests:**
   ```bash
   make test
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

Examples:
- `feature/add-qr-scanner`
- `fix/rate-limit-bug`
- `docs/update-api-spec`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

Examples:
```
feat(relayer): add rate limiting middleware
fix(indexer): handle reorg edge case
docs: update API documentation
test(relayer): add integration tests
```

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** with appropriate tests
3. **Run the test suite** locally
4. **Update documentation** if needed
5. **Create a pull request** with a clear description

#### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Code Style

### TypeScript/JavaScript

- Use ESLint and Prettier configurations
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`

### Solidity

- Follow Solidity style guide
- Use NatSpec documentation
- Include comprehensive tests
- Use Foundry for testing and deployment

### Testing

- Write tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Test both success and failure cases

## Project Structure

```
null-protocol/
├── contracts/           # Smart contracts (Foundry)
├── apps/
│   ├── relayer-tickets/ # Fastify API server
│   ├── indexer-tickets/ # PostgreSQL indexer
│   ├── scanner-pwa/     # React PWA
│   └── pinning-adapter/ # IPFS pinning service
├── deploy/              # Deployment configurations
├── ops/                 # Operational tools
└── docs/                # Documentation
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific app tests
npm -w apps/relayer-tickets test
npm -w apps/indexer-tickets test

# Run smart contract tests
forge test
```

### Integration Tests

```bash
# Start test environment
make up

# Run integration tests
make seed
```

### End-to-End Tests

```bash
# Run smoke tests
bash ops/curl-examples.sh
```

## Documentation

### API Documentation

- Update `OPENAPI.relayer.yaml` for API changes
- Include examples and descriptions
- Document error responses

### Code Documentation

- Add JSDoc comments for functions
- Include inline comments for complex logic
- Update README files for significant changes

## Security

### Security Considerations

- Never commit secrets or private keys
- Use environment variables for configuration
- Follow security best practices
- Report security issues to security@null.xyz

### Security Review

All changes to security-critical components require review:
- Smart contracts
- Relayer authentication
- Database queries
- API endpoints

## Performance

### Performance Guidelines

- Optimize database queries
- Use appropriate caching strategies
- Monitor memory usage
- Profile critical paths

### Monitoring

- Add metrics for new features
- Include performance tests
- Monitor error rates and latency

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance tested
- [ ] Changelog updated
- [ ] Version bumped

## Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat and support
- **Email**: contact@null.xyz

### Resources

- [API Documentation](https://docs.null.xyz/api)
- [Smart Contract Documentation](https://docs.null.xyz/contracts)
- [Deployment Guide](https://docs.null.xyz/deploy)
- [Security Guide](SECURITY.md)

## Recognition

Contributors will be recognized in:
- Release notes
- Contributor hall of fame
- Annual contributor awards

Thank you for contributing to the Null Protocol! 🚀
