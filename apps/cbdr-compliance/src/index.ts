/**
 * CBDR Compliance API - Main Entry Point
 */

import { CBDRServer } from './server';
import { loadConfig } from './config';

async function main() {
  try {
    const config = loadConfig();
    const server = new CBDRServer(config);
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    // Start the server
    await server.start();
  } catch (error) {
    console.error('Failed to start CBDR Compliance API:', error);
    process.exit(1);
  }
}

// Start the application
main();
