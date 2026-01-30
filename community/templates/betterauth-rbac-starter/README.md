# BetterAuth RBAC Starter: Secure AI Agent Template 🔐

A high-performance, production-ready starter template integrating **BetterAuth v1** and **Tambo AI** with a focus on Role-Based Access Control (RBAC) and accessibility via Native Voice.

![BetterAuth RBAC Starter](assets/octo-white-background-rounded.png)

## 🎯 What this template demonstrates

This template solves the "Security Gap" in Generative UI by demonstrating how to pass authentication context into AI agents. It features:

- **Fine-Grained RBAC**: AI tools are dynamically enabled/disabled based on the user's role (Admin vs. User).
- **Native Voice Control**: Fully integrated Web Speech API for hands-free prompting and UI interaction.
- **Generative UI Mastery**: Professional internal health monitors and profile cards that only render for authorized entities.
- **Zero-Config Architecture**: Uses local SQLite with auto-initialization for a "cloned and run" developer experience.

## 🛠️ Technology Stack

- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router)
- **Intelligence**: [@tambo-ai/react](https://tambo.ai) (Generative UI SDK)
- **Authentication**: [BetterAuth](https://www.better-auth.com/) (latest stable)
- **Database**: SQLite (via `better-sqlite3`)
- **Styling**: Tailwind CSS 4.0 (Modern Glassmorphism)

## 🚀 Getting Started

### 1. Prerequisites

- **Tambo API Key**: Get your key from the [Tambo Dashboard](https://tambo.ai).

### 2. Setup

```bash
# Clone and install
npm install

# Configure environment
cp .env.example .env.local
# Add your TAMBO_API_KEY to .env.local
```

### 3. Launch

```bash
npm run dev
```

The database will automatically initialize on your first run.

## 🎥 Video Demonstration

Check out the video demonstration in the PR description or viewing the live demo.

## 📁 Key Folder Structure

- `src/lib/auth.ts`: BetterAuth server configuration with Admin plugin.
- `src/lib/tools.ts`: Tambo Tool & Component definitions with role-based security.
- `src/components/tambo/`: Interactive Generative UI components.
- `src/app/dashboard/`: The core agent interface with voice integration.

---

Built with 🖤 for the Tambo Community.
