# Simple fat Docker image for API
FROM node:22-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat curl

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
RUN chown nestjs:nodejs /app
USER nestjs
# Copy everything
COPY --chown=nestjs:nodejs . .

# Install all dependencies
RUN npm ci

# Set Node.js options for build
ENV NODE_OPTIONS="--experimental-require-module"

# Build the application
RUN npx turbo build --filter=hydra-api

# Set production environment
ENV NODE_ENV=production



EXPOSE 3000

ENV PORT=3000

CMD ["node", "apps/api/dist/apps/api/src/main"]