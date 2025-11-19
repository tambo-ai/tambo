# Simple fat Docker image for Web
FROM node:22-alpine
RUN npm install -g npm@^11


# Install system dependencies (aligned with API)
RUN apk add --no-cache libc6-compat curl

# Set working directory
WORKDIR /app

# Create non-root user (aligned with API)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
RUN chown nodejs:nodejs /app

# Set permissions
USER nodejs

# Copy root files needed for turbo
COPY --chown=nodejs:nodejs package.json package-lock.json turbo.json ./

# Copy react-sdk workspace package (required by tambo-cloud apps)
COPY --chown=nodejs:nodejs react-sdk/ ./react-sdk/

# Copy tambo-cloud directory
COPY --chown=nodejs:nodejs tambo-cloud/ ./tambo-cloud/

# Install all dependencies from root
RUN npm ci

# Build the application from root (where turbo.json is)
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN SKIP_ENV_VALIDATION=true npx turbo build --filter=tambo-ai-landing-page

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

WORKDIR /app/tambo-cloud/apps/web
CMD ["npx", "next", "start"]