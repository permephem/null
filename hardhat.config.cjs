require('@nomicfoundation/hardhat-toolbox');
require('@nomicfoundation/hardhat-verify');
require('hardhat-gas-reporter');
require('solidity-coverage');

const config = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
      accounts: process.env.RELAYER_PRIVATE_KEY ? [process.env.RELAYER_PRIVATE_KEY] : [],
      chainId: 84532,
    },
    base: {
      url: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      accounts: process.env.RELAYER_PRIVATE_KEY ? [process.env.RELAYER_PRIVATE_KEY] : [],
      chainId: 8453,
    },
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
      accounts: process.env.RELAYER_PRIVATE_KEY ? [process.env.RELAYER_PRIVATE_KEY] : [],
      chainId: 1,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/your-api-key',
      accounts: process.env.RELAYER_PRIVATE_KEY ? [process.env.RELAYER_PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY || '',
      baseSepolia: process.env.BASESCAN_API_KEY || '',
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
    },
    customChains: [
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org',
        },
      },
      {
        network: 'baseSepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org',
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    gasPrice: 20,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },
  paths: {
    sources: './contracts',
    tests: './tests/contracts',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 40000,
  },
};

module.exports = config;
