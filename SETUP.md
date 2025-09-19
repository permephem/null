# Development Setup

## Prerequisites

1. **Node.js** (v18 or later)
2. **Foundry** - Solidity development framework

## Foundry Installation

### macOS/Linux
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Windows
```bash
# Install via Git Bash or WSL
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Environment Setup

### 1. Add Foundry to PATH

Add Foundry to your shell profile:

**For zsh (macOS default):**
```bash
echo 'export PATH="$PATH:$HOME/.foundry/bin"' >> ~/.zshrc
source ~/.zshrc
```

**For bash:**
```bash
echo 'export PATH="$PATH:$HOME/.foundry/bin"' >> ~/.bashrc
source ~/.bashrc
```

### 2. Verify Installation
```bash
forge --version
cast --version
anvil --version
```

## Project Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd null-protocol
npm install
```

2. **Install Foundry dependencies:**
```bash
forge install
```

3. **Build contracts:**
```bash
npm run compile
```

4. **Run tests:**
```bash
npm run test:contracts
```

## Available Scripts

- `npm run compile` - Build contracts
- `npm run test:contracts` - Run Foundry tests
- `npm run test:unit` - Run unit tests
- `npm run test:invariant` - Run invariant tests
- `npm run test:fuzz` - Run fuzz tests
- `npm run test:coverage` - Generate test coverage
- `npm run test:gas` - Generate gas reports
- `npm run format` - Format code
- `npm run lint` - Lint code
- `npm run anvil` - Start local blockchain
- `npm run deploy:local` - Deploy to local network

## Troubleshooting

### "forge: not found" Error

If you get `sh: 1: forge: not found` when running npm scripts:

1. **Check if Foundry is installed:**
```bash
which forge
```

2. **Add Foundry to PATH** (see Environment Setup above)

3. **Restart your terminal** or run `source ~/.zshrc` (or `~/.bashrc`)

4. **Verify PATH includes Foundry:**
```bash
echo $PATH | grep foundry
```

### GitHub Actions

The CI/CD pipeline automatically installs Foundry, so no additional setup is needed for automated testing and deployment.

## Development Workflow

1. **Start local blockchain:**
```bash
npm run anvil
```

2. **In another terminal, run tests:**
```bash
npm run test:contracts
```

3. **Deploy to local network:**
```bash
npm run deploy:local
```

4. **Format and lint before committing:**
```bash
npm run format
npm run lint
```
