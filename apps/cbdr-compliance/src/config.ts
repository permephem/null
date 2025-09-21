/**
 * Configuration for CBDR Compliance API
 */

import { CBDRConfig } from './types';

export function loadConfig(): CBDRConfig {
  return {
    port: parseInt(process.env.PORT || '8787'),
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      name: process.env.DB_NAME || 'cbdr_compliance',
      user: process.env.DB_USER || 'cbdr_app',
      password: process.env.DB_PASSWORD || 'password'
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    },
    regulatory: {
      update_interval_hours: parseInt(process.env.REGULATORY_UPDATE_INTERVAL || '24'),
      sources: (process.env.REGULATORY_SOURCES || 'eu_commission,ico,ftc').split(',')
    },
    cache: {
      default_ttl_seconds: parseInt(process.env.CACHE_DEFAULT_TTL || '300'),
      adequacy_ttl_seconds: parseInt(process.env.CACHE_ADEQUACY_TTL || '86400'),
      scc_ttl_seconds: parseInt(process.env.CACHE_SCC_TTL || '3600'),
      derogation_ttl_seconds: parseInt(process.env.CACHE_DEROGATION_TTL || '0')
    },
    security: {
      jws_secret: process.env.JWS_SECRET || 'your-secret-key-change-in-production',
      api_key_required: process.env.API_KEY_REQUIRED === 'true',
      rate_limit_per_minute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '100')
    },
    webhooks: {
      enabled: process.env.WEBHOOKS_ENABLED === 'true',
      endpoints: (process.env.WEBHOOK_ENDPOINTS || '').split(',').filter(Boolean),
      retry_attempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3')
    }
  };
}
