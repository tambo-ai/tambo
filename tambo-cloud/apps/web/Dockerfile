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

# Copy everything
COPY --chown=nodejs:nodejs . .

# Install all dependencies
RUN npm ci

# Build the application
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN SKIP_ENV_VALIDATION=true npx turbo build --filter=tambo-ai-landing-page

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

WORKDIR /app/apps/web
CMD ["npx", "next", "start"]