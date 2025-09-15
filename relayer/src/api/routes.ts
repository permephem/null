import { Router } from 'express';
import type { RelayerService } from '../services/RelayerService.js';

const router = Router();

// This will be injected by the main application
let relayerService: RelayerService;

export function setRelayerService(service: RelayerService) {
  relayerService = service;
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Submit warrant endpoint
router.post('/warrants', async (req, res, next) => {
  try {
    const result = await relayerService.processWarrant(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Submit attestation endpoint
router.post('/attestations', async (req, res, next) => {
  try {
    const result = await relayerService.processAttestation(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get status endpoint
router.get('/status/:id', async (req, res, next) => {
  try {
    const result = await relayerService.getStatus(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
