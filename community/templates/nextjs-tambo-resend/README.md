# Next.js + Tambo + Resend -- AI Email Assistant

**A Next.js starter template that uses Tambo to draft, preview, and send emails via Resend using natural language.**

This template demonstrates how to use **Tambo** to generate UI and execute real-world actions by drafting and sending emails through **Resend**.

It is designed to give new Tambo users a clear, end-to-end example of:
- a **generative UI component**
- a **tool with real side effects**
- an **AI-controlled interaction flow**

---

## What This Template Demonstrates

- **Generative Component**  
  The AI renders an `EmailPreview` component to show a draft email.

- **Tool with Side Effects**  
  The AI can call a `sendEmail` tool to send a real email using Resend.

- **AI-Controlled Flow**  
  Natural language → UI preview → user confirmation → email sent.

This is a minimal but complete starter showing how Tambo can both **render UI** and **trigger real-world actions**.

---

## Tech Stack

- **Next.js** (App Router)
- **Tambo** (AI-controlled UI + tools)
- **Resend** (email delivery)
- **Zod** (tool & component schemas)

---

## Getting Started

### Quick Setup

```bash
cd community/templates/nextjs-tambo-resend
npm install
cp .env.example .env.local
npm run dev
Open http://localhost:3000
```

### Environment Configuration

Add the following variables to your `.env.local` file:

```env
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=onboarding@resend.dev
```

- You can use `onboarding@resend.dev` for development without domain verification.
- The recipient does not need a Resend account—emails can be sent to any external address.

---

## Try It Out

In the chat, try:

1. **Draft an email**  
   Example: "Write a polite internship follow-up email to test@example.com. Keep it professional and concise."

2. **Preview the email**  
   After the email preview appears, confirm by saying:

   ```
   Send this email
   ```

3. **Receive the email**  
   You should see a confirmation message and receive the email in your inbox.

---

## How It Works

### Key Components

- **`EmailPreview` Component**  
  Registered as a Tambo component and rendered dynamically by the AI to display the drafted email.

- **`sendEmail` Tool**  
  Registered as a Tambo tool and implemented using Resend’s API to send real emails.

- **`TamboProvider`**  
  Connects registered components and tools, allowing the AI to decide what to render and when to act.

### Explore the Code

- **`src/components/tambo/EmailPreview.tsx`**  
  AI-rendered email preview component.

- **`src/services/send-email.ts`**  
  Server action that sends email via Resend.

- **`src/lib/tambo.ts`**  
  Central registration of Tambo components and tools.

- **`src/app/chat/page.tsx`**  
  Chat interface powered by Tambo.

---
## Demo

- **Video demo:** https://github.com/user-attachments/assets/9e97642c-fcca-4bf5-9800-3c89c6cc23db

- **Screenshot:**

![Email preview rendered in chat](https://github.com/user-attachments/assets/3a83f041-e292-4720-abad-15e1c09fc5b5)

![Email sent confirmation](https://github.com/user-attachments/assets/7c6e3b1b-c324-49a3-867d-66dcc23ef54f)

## Notes

- Do not commit `.env.local`.
- `.env.example` is provided for reference.
- This template intentionally keeps scope small to focus on clarity and learning.

---

## Learn More

- **[Tambo Docs](https://docs.tambo.co)**
- **[Resend Docs](https://resend.com/docs)**