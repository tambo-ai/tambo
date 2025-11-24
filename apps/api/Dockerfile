FROM node:22-alpine AS base
# ---- base ----

# Install NPM globally
RUN npm install -g npm@^11

# Install system dependencies (aligned with @tambo-ai-cloud/web)
RUN apk add --no-cache libc6-compat

# ---- /base ----

FROM base AS installer
# ---- installer ----
# responsible for preparing the pruned workspace

WORKDIR /workspace
COPY . .
RUN npx turbo prune @tambo-ai-cloud/api --docker

# ---- /installer ----

FROM base AS builder
# ---- builder ----
# responsible for installing dependencies and building the app

# Set working directory
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

# Build the application
RUN \
  --mount=type=cache,id=turbo-cache,target=/workspace/.turbo/cache \
  --mount=type=cache,id=next-cache,target=/workspace/apps/api/.next/cache \
  --mount=type=secret,id=TURBO_TEAM,env=TURBO_TEAM \
  --mount=type=secret,id=TURBO_TOKEN,env=TURBO_TOKEN \
  --mount=type=secret,id=TURBO_API,env=TURBO_API \
  npx turbo run build --filter="@tambo-ai-cloud/api"

# ---- /builder ----

FROM node:22-alpine AS runner
# ---- runner ----
# responsible for running the built app

# Set working directory
WORKDIR /app

# Create non-root user (aligned with Web)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
RUN chown nodejs:nodejs /app
USER nodejs

COPY --from=builder /workspace/ ./

# Set production environment
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD [ "wget", "-qO-", "http://localhost:3000/health" ]

EXPOSE 3000

ENV PORT=3000

CMD ["node", "apps/api/dist/apps/api/src/main"]
