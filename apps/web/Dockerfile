FROM node:22-alpine AS base
# ---- base ----

# Upgrade npm to v11 (npx bootstraps a working copy to bypass broken
# promise-retry in the bundled npm on node:22-alpine)
RUN npx -y npm@11 install -g npm@^11

# Install system dependencies (aligned with @tambo-ai-cloud/api)
RUN apk add --no-cache gcompat dumb-init

# ---- /base ----

FROM base AS installer
# ---- installer ----
# responsible for preparing the pruned workspace

WORKDIR /workspace

COPY turbo.json package.json package-lock.json ./

# install repo root dependencies for consistent tooling
RUN npm ci --workspaces=false

COPY react-sdk ./react-sdk
COPY packages ./packages
COPY apps/web ./apps/web
COPY scripts ./scripts

RUN npx turbo prune @tambo-ai-cloud/web --docker

# ---- /installer ----

FROM base AS builder
# ---- builder ----
# responsible for installing dependencies and building the app

WORKDIR /workspace

# install dependencies solo
COPY --from=installer /workspace/out/json/ .
RUN npm ci

# copy source from pruned output and then build
COPY --from=installer /workspace/out/full/ .

# Required for loading Next config in a pruned workspace (`next.config.mjs` imports from `scripts/`)
# Build-time only; the final image uses the Next standalone output.
# If `next.config.mjs` starts importing other repo-root files, they must be copied into this stage too.
COPY --from=installer /workspace/scripts ./scripts

# Set production environment and build variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1
ENV TURBO_CACHE_DIR=/workspace/.turbo/cache
ENV NODE_OPTIONS="--max-old-space-size=4096"
ARG TURBO_TEAM
ARG TURBO_API

# Build the application
RUN --mount=type=secret,id=TURBO_TOKEN,env=TURBO_TOKEN \
  npx turbo run build --filter="@tambo-ai-cloud/web"

# ---- /builder ----

FROM base
# ---- final ----
# responsible for running the built app

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 nodejs \
  && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs \
  && chown -R nodejs:nodejs ./
USER nodejs

# Copy files
# Using standalone build to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /workspace/apps/web/.next/standalone  ./
COPY --from=builder /workspace/apps/web/.next/static      ./apps/web/.next/static
COPY --from=builder /workspace/apps/web/public            ./apps/web/public

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget -qO- http://${HOSTNAME}:${PORT}

# Set production environment
ENV NODE_ENV=production

# Run with dumb-init to not start node with PID=1, see: https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
CMD [ "dumb-init", "node", "apps/web/server.js" ]
