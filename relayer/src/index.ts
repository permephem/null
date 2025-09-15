#!/usr/bin/env node

/**
 * Null Protocol Relayer
 * Main entry point for the relayer system
 * @author Null Foundation
 */

import { config } from 'dotenv';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { apiRoutes } from './api/routes.js';
import { RelayerService } from './services/RelayerService.js';
import { CanonService } from './canon/CanonService.js';
import { SBTService } from './sbt/SBTService.js';
import { EmailService } from './email/EmailService.js';

// Load environment variables
config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function main() {
  try {
    logger.info('Starting Null Protocol Relayer...');

    // Initialize services
    const canonService = new CanonService();
    const sbtService = new SBTService();
    const emailService = new EmailService();
    const _relayerService = new RelayerService(canonService, sbtService, emailService);

    // Initialize Express app
    const app = express();

    // Security middleware
    app.use(helmet());
    app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    app.use(rateLimiter);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        environment: NODE_ENV
      });
    });

    // API routes
    app.use('/api/v1', apiRoutes);

    // Error handling middleware
    app.use(errorHandler);

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // Start server
    const server = createServer(app);
    
    server.listen(PORT, () => {
      logger.info(`Null Protocol Relayer started on port ${PORT}`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start relayer:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  logger.error('Application startup failed:', error);
  process.exit(1);
});
