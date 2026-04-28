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

COPY packages ./packages
COPY apps/api ./apps/api

RUN npx turbo prune @tambo-ai-cloud/api --docker

# ---- /installer ----

FROM base AS builder
# ---- builder ----
# responsible for installing dependencies and building the app

# Set working directory
WORKDIR /workspace

# install dependencies solo
COPY --from=installer /workspace/out/json/ .
# Use the full lockfile (not the pruned one) to preserve nested dep resolutions.
# Turbo prune can promote packages like log-symbols@4 to the root without their
# required chalk@4 sibling, causing "chalk.blue is not a function" at build time
# when NODE_OPTIONS=--experimental-require-module is in use.
COPY --from=installer /workspace/package-lock.json ./
RUN npm ci

# copy source from pruned output and then build
COPY --from=installer /workspace/out/full/ .

# Set production environment and build variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1
ENV TURBO_CACHE_DIR=/workspace/.turbo/cache
ARG TURBO_TEAM
ARG TURBO_API

# Build the application
RUN --mount=type=secret,id=TURBO_TOKEN,env=TURBO_TOKEN \
  npx turbo run build --filter="@tambo-ai-cloud/api"

# ---- /builder ----

FROM base
# ---- runner ----
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
COPY --from=builder /workspace/      ./
COPY                ./scripts/cloud  ./scripts/cloud

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget -qO- http://${HOSTNAME}:${PORT}

# Set production environment
ENV NODE_ENV=production

# Run with dumb-init to not start node with PID=1, see: https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
CMD [ "dumb-init", "node", "apps/api/dist/apps/api/src/main" ]
