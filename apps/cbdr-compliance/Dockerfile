# CBDR Compliance API Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cbdr -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=cbdr:nodejs /app/dist ./dist
COPY --from=builder --chown=cbdr:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=cbdr:nodejs /app/package*.json ./

# Copy SQL files for initialization
COPY --chown=cbdr:nodejs sql/ ./sql/

# Switch to non-root user
USER cbdr

# Expose port
EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8787/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
