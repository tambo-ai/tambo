# Drizzle Analytics Starter 📊

A high-performance foundation for data-heavy AI applications using **Next.js**, **Drizzle ORM**, and **Tambo**.

## 🎯 What this template demonstrates
This template shows how to create a "Source of Truth" architecture where an AI assistant queries a local SQLite database and renders the results in a generative, high-fidelity UI component.

- **Generative UI**: Uses a virtualized `DataTableViewer` component for data display.
- **Drizzle Integration**: Demonstrates how to pipe Drizzle queries directly into Tambo's tool orchestration.
- **Official Structure**: Strictly follows the directory and centralization patterns of the official Tambo templates.

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Drizzle ORM + SQLite (Better-SQLite3)
- **AI SDK**: @tambo-ai/react
- **Styling**: Tailwind CSS


## 🚀 Getting Started

### 1. Prerequisites
Ensure you have a Tambo API Key from the [Tambo Dashboard](https://tambo.co).

### 2. Setup
```bash
# Install dependencies
npm install

# Initialize your local database
npm run db:push

# Seed the database with sample analytics
npm run db:seed

 **Run the Development Server**:
   ```bash
   npm run dev
   ```

## 🎥 Video Demo

Click the thumbnail below to watch the demo:

[![App Demo](https://github.com/user-attachments/assets/62e7506a-e9fe-49f2-a285-79ce14a3992d)](https://github.com/user-attachments/assets/62e7506a-e9fe-49f2-a285-79ce14a3992d)

---

## 📸 Screenshots

![Dashboard](https://github.com/user-attachments/assets/ac3869e2-4033-4fb9-92df-fd3e6df57a31)

![Chat Interface](https://github.com/user-attachments/assets/2b531bd8-ea92-4cd0-beab-8f29a2503556)

![backend update View](https://github.com/user-attachments/assets/b203d3f0-d185-418f-ac16-378af95de1f7)