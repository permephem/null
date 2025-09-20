FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]
