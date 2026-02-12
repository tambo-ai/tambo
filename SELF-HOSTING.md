# Self-Hosting Guide

This guide is for deploying and self-hosting Tambo..

> **Looking to contribute?** See [CONTRIBUTING.md](./CONTRIBUTING.md) for local development setup.

## Overview

Tambo consists of three services:

| Service        | Technology    | Host Port | Description                  |
| -------------- | ------------- | --------- | ---------------------------- |
| **Web**        | Next.js       | 8260      | Dashboard and user interface |
| **API**        | NestJS        | 8261      | REST API for client requests |
| **PostgreSQL** | PostgreSQL 17 | 5433      | Database                     |

## Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed
- OpenAI API key (or compatible provider)

### 1. Clone the Repository

```bash
git clone https://github.com/tambo-ai/tambo.git
cd tambo
```

### 2. Set Up Environment

```bash
./scripts/cloud/tambo-setup.sh
```

This creates `docker.env` from `docker.env.example`.

### 3. Configure Environment Variables

Edit `docker.env` with your values. At minimum, you must set:

```bash
# Required
POSTGRES_PASSWORD=your-secure-password-here
API_KEY_SECRET=your-32-character-api-key-secret
PROVIDER_KEY_SECRET=your-32-character-provider-secret
NEXTAUTH_SECRET=your-nextauth-secret
FALLBACK_OPENAI_API_KEY=your-openai-api-key
```

`docker.env.example` includes placeholder values; replace them with strong secrets before starting the stack.

### 4. Start Services

```bash
./scripts/cloud/tambo-start.sh
```

### 5. Initialize Database

```bash
./scripts/cloud/init-database.sh
```

### 6. Access Your Deployment

- **Web Dashboard**: http://localhost:8260
- **API**: http://localhost:8261

## Learn More

For detailed configuration, production deployment, and operations guides, see the docs site:

- [Self-Hosting Overview](https://tambo.ai/docs/guides/self-hosting) — Architecture, auth model, and security considerations
- [Quickstart](https://tambo.ai/docs/guides/self-hosting/quickstart) — Step-by-step first deployment
- [Authentication](https://tambo.ai/docs/guides/self-hosting/authentication) — OAuth and email login setup
- [Docker Compose](https://tambo.ai/docs/guides/self-hosting/docker-compose) — Production deployment and building images
- [Kubernetes](https://tambo.ai/docs/guides/self-hosting/kubernetes) — K8s manifests for all three services
- [Operations](https://tambo.ai/docs/guides/self-hosting/operations) — Backup, restore, upgrade, and monitoring
- [Environment Variables](https://tambo.ai/docs/guides/self-hosting/environment-variables) — Full reference for all configuration options
- [Scripts](https://tambo.ai/docs/guides/self-hosting/scripts) — All helper scripts and npm aliases
- [Troubleshooting](https://tambo.ai/docs/guides/self-hosting/troubleshooting) — Common issues and fixes
