# Simple fat Docker image for API
FROM node:22-alpine
RUN npm install -g npm@^11

# Install system dependencies (aligned with Web)
RUN apk add --no-cache libc6-compat curl

# Set working directory
WORKDIR /app

# Create non-root user (aligned with Web)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
RUN chown nodejs:nodejs /app
USER nodejs

# Copy root files needed for turbo
COPY --chown=nodejs:nodejs package.json package-lock.json turbo.json ./

# Copy tambo-cloud directory
COPY --chown=nodejs:nodejs tambo-cloud/ ./tambo-cloud/

# Install all dependencies from root
RUN npm ci

# Set Node.js options for build
ENV NODE_OPTIONS="--experimental-require-module"

# Build the application from root (where turbo.json is)
RUN npx turbo build --filter=hydra-api

# Set production environment
ENV NODE_ENV=production

EXPOSE 3000

ENV PORT=3000

CMD ["node", "tambo-cloud/apps/api/dist/apps/api/src/main"]