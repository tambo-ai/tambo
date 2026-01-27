# Privacy-First Invoice Starter (Next.js + Tambo + Zustand)

A local-first starter template for building privacy-centric AI tools where data stays in the browser.

![App Screenshot](./screenshot.png)

## What this template demonstrates
* **Local-First Architecture:** Uses Zustand with `persist` middleware to keep user data in `localStorage`.
* **Tambo Integration:** AI commands directly manipulate the local state (e.g., "Add item") without server-side database calls.
* **Split View:** Responsive layout optimized for Chat-assisted document creation.

## Video Demo
[Watch the Demo Here](PASTE_YOUR_VIDEO_LINK_HERE)

## Prerequisites
* Node.js 18+

## Setup Instructions
1.  Navigate to the folder:
    ```bash
    cd community/templates/nextjs-privacy-invoice
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

## Technology Stack
* **Next.js 14** (App Router)
* **Zustand** (State Management & Local Persistence)
* **Tailwind CSS** (Styling)
* **Lucide React** (Icons)