# Hono AI Starter 🚀

A surgical, edge-ready starter template for building AI apps with **Next.js**, **Hono**, and **Tambo**.

## 🎯 Why this template?
- **Minimalist & Surgical**: Demonstrated via a simple CRUD API for task management.
- **High Design Bar**: Custom dark-mode chat interface built using Tambo's `useTamboThread` hooks.
- **Edge Compatible**: Uses the Hono/Vercel adapter to run backend logic on the edge for ultra-low latency.
- **10-Minute Guttable**: Clean folder structure designed for developers to delete the demo and start building instantly.

## 🛠️ Technologies
- **Frontend**: Next.js 15 (App Router), Tailwind CSS
- **Backend**: Hono (Edge Runtime)
- **SDK**: Tambo React SDK (`@tambo-ai/react`)

## 🔑 Prerequisites
You will need a **Tambo API Key**.
1. Create a project at [tambo.co](https://tambo.co).
2. Copy your Secret Key.

## 🚀 Setup Instructions
1. **Install Dependencies**:
   ```bash
   npm install

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

[![App Demo](https://github.com/user-attachments/assets/0da60313-33ef-4c81-93c8-937a922d6ab6)](https://github.com/user-attachments/assets/0da60313-33ef-4c81-93c8-937a922d6ab6)

---

## 📸 Screenshots

![Dashboard](https://github.com/user-attachments/assets/b20eb2e1-f4e8-47b5-8e08-79f9ed0ddf3b)

![Chat Interface](https://github.com/user-attachments/assets/09f1eb4f-2c80-4788-922f-625390f0298f)

![Workflow View](https://github.com/user-attachments/assets/910eb9ad-d8c6-44f8-9310-911aff067925)

![backend update View](https://github.com/user-attachments/assets/896aaa01-cbc3-44bf-b61d-007de6fc3c40)

