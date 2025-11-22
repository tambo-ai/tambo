# Simple fat Docker image for Web
FROM node:22-alpine AS base
# ---- base ----

# Install NPM globally
RUN npm install -g npm@^11

# Install system dependencies (aligned with @tambo-ai-cloud/api)
RUN apk add --no-cache libc6-compat

# ---- /base ----

FROM base AS installer
# ---- installer ----
# responsible for preparing the pruned workspace

WORKDIR /workspace
COPY . .
RUN npx turbo prune @tambo-ai-cloud/web --docker

# ---- /installer ----

FROM base AS builder
# ---- builder ----
# responsible for installing dependencies and building the app

WORKDIR /workspace

ENV NPM_CONFIG_CACHE=/workspace/.npm/cache
# install dependencies solo
COPY --from=installer /workspace/out/json/ .
RUN \
  --mount=type=cache,id=npm-cache,target=/workspace/.npm/cache \
  npm ci

# copy source from pruned output and then build
COPY --from=installer /workspace/out/full/ .

# Set production environment and build variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1
ENV TURBO_CACHE_DIR=/workspace/.turbo/cache
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_BUILD_STANDALONE=true

# Build the application
RUN \
  --mount=type=cache,id=turbo-cache,target=/workspace/.turbo/cache \
  --mount=type=cache,id=next-cache,target=/workspace/apps/web/.next/cache \
  --mount=type=secret,id=TURBO_TEAM,env=TURBO_TEAM \
  --mount=type=secret,id=TURBO_TOKEN,env=TURBO_TOKEN \
  --mount=type=secret,id=TURBO_API,env=TURBO_API \
  npx turbo run build --filter="@tambo-ai-cloud/web"

# ---- /builder ----

FROM node:22-alpine AS runner
# ---- runner ----
# responsible for running the built app

# Set working directory
WORKDIR /workspace

# Create non-root user (aligned with API)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
RUN chown nodejs:nodejs /workspace
USER nodejs

# Copy files
# Using standalone build to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nodejs:nodejs /workspace/apps/web/.next/standalone  ./
COPY --from=builder --chown=nodejs:nodejs /workspace/apps/web/.next/static      ./apps/web/.next/static
COPY --from=builder --chown=nodejs:nodejs /workspace/apps/web/public            ./apps/web/public

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD [ "wget", "-qO-", "http://localhost:3000" ]

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT [ "node", "/workspace/apps/web/server.js" ]