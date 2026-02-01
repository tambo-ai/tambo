# ⚡ Hono AI Starter

A professional, edge-native starter template for building AI applications using Hono and Tambo. This template provides a clean production foundation with pre-configured Edge routes, Zod validation, and Generative UI components.

---

## 📝 Overview

Hono AI Starter is designed for developers who want to build fast, type-safe AI applications on the Edge. It ships with a minimal but extensible architecture, demonstrating Generative UI, schema-validated tools, and a neutral Tailwind v4 interface that’s easy to customize.

---

## ✨ Features

- Edge-native Hono backend
- Pre-configured Next.js API routes
- Zod-powered validation for all tools
- Generative UI components
- Clean, minimalist Tailwind v4 chat interface
- TypeScript-first architecture
- Simple extension model for adding tools and components

## 🛠️ Tech Stack

- **Framework**: Next.js 15.0.3 (App Router)
- **API**: Hono (running on Edge)
- **AI SDK**: @tambo-ai/react
- **Validation**: Zod + @hono/zod-validator
- **Styling**: Tailwind CSS v4

## 🏁 Getting Started

### 1. Prerequisites

Ensure you have Node.js 20+ installed.

### 2. Installation

Clone the repository and install dependencies using the legacy peer deps flag (required for Next 15 + React 19 compatibility):

## 🚀 Setup Instructions

1. **Install Dependencies**:

   ```bash
   npm install

   ```

2. **Set Environment Variables**:
   Create a `.env.local` file in the root of the project with the following content:
   ```env
   NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key_here
   ```
3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
4. **Open Your Browser**:
   Navigate to `http://localhost:3000` to see the app in action.

## 🎥 Video Demo

Click the thumbnail below to watch the demo:

[![App Demo](https://github.com/user-attachments/assets/34bf37bc-aab7-463d-b59f-0cb7b1e7d930)](https://github.com/user-attachments/assets/34bf37bc-aab7-463d-b59f-0cb7b1e7d930)

---

## 📸 Screenshots

![Dashboard](https://github.com/user-attachments/assets/a96005cb-96a4-4bfd-b6ea-7ab2daaaa995)

![Chat Interface](https://github.com/user-attachments/assets/7d9807aa-242b-4a29-8597-8408289d7d02)

![backend View](https://github.com/user-attachments/assets/ec20c0b7-5a5a-40c3-abbc-80cf4e77d09a)
