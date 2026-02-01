# Hono AI Starter Template

A high-performance, edge-native AI starter kit for the [Tambo AI ecosystem](https://tambo.co). This template combines **Next.js 15**, **Hono**, and **Tailwind CSS v4** to create a seamless Generative UI experience.

## 🚀 Features

- **Edge-Ready Backend**: Powered by Hono and deployed on the Edge Runtime for sub-millisecond latency.
- **Generative UI**: Includes a pre-configured `TaskList` component that the AI renders automatically using Tambo's tool-calling logic.
- **Type Safety**: Built with **TypeScript**, **React 19**, and strict **Zod** validation for both tool inputs and outputs.
- **Modern Styling**: Uses **Tailwind CSS v4** with native theme variables and dark mode support.

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

[![App Demo](https://github.com/user-attachments/assets/5d5d8013-dd53-49d1-9827-2daf9db8f747)](https://github.com/user-attachments/assets/5d5d8013-dd53-49d1-9827-2daf9db8f747)

---

## 📸 Screenshots

![Dashboard](https://github.com/user-attachments/assets/a96005cb-96a4-4bfd-b6ea-7ab2daaaa995)

![Chat Interface](https://github.com/user-attachments/assets/126d9878-caf9-4850-a562-c362a85ba0bb)

![Workflow View](https://github.com/user-attachments/assets/491f1122-c80f-4b2d-8e50-0db93b18c0b7)

![backend update View](https://github.com/user-attachments/assets/c039a0cc-f936-46be-92b7-32ba65d75509)
