# Next.js + Tambo + Resend — AI Email Assistant

A starter template demonstrating how to use **Tambo** to generate UI and execute real-world actions by drafting and sending emails via **Resend**.

This template is designed to give new Tambo users a clear, end-to-end example of:
- a **generative UI component**
- a **tool with real side effects**
- an **AI-controlled interaction flow**

---

##  What This Template Demonstrates

- **Generative Component**  
  The AI renders an `EmailPreview` component to show a draft email.

- **Tool with Side Effects**  
  The AI can call a `sendEmail` tool to send a real email using Resend.

- **AI-Controlled Flow**  
  Natural language → UI preview → user confirmation → email sent.

This is a minimal but complete example of how Tambo can both **render UI** and **perform actions**.

---

##  Tech Stack

- **Next.js** (App Router)
- **Tambo** (AI-controlled UI + tools)
- **Resend** (email delivery)
- **Zod** (tool & component schemas)

---

##  Getting Started

### Quick Setup

Copy and run all commands at once:

```bash
cd community/templates/nextjs-tambo-resend
npm install
cp .env.example .env.local
npm run dev
```

### Environment Configuration

Add these variables to your `.env.local` file:

```
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=onboarding@resend.dev
```

> You can use `onboarding@resend.dev` for development without domain verification.

Open [http://localhost:3000](http://localhost:3000)

---

##  Try It Out (Recommended)

In the chat, try the following:

1. Write a polite internship follow-up email to test@example.com.
2. Keep it professional and concise.

After the email preview appears, send:

```
Send this email
```

You should see a confirmation message and receive the email in your inbox.

---

##  How It Works

### EmailPreview component

Registered as a Tambo component and rendered dynamically by the AI.

### sendEmail tool

Registered as a Tambo tool and implemented using Resend's API.

### TamboProvider

Connects components and tools, allowing the AI to decide what to render and when to act.

You can explore these registrations in [src/lib/tambo.ts](src/lib/tambo.ts).

---

##  Key Files

- [src/components/tambo/EmailPreview.tsx](src/components/tambo/EmailPreview.tsx) — AI-rendered email preview component
- [src/services/send-email.ts](src/services/send-email.ts) — Server action that sends email via Resend
- [src/lib/tambo.ts](src/lib/tambo.ts) — Central registration of Tambo components and tools
- [src/app/chat/page.tsx](src/app/chat/page.tsx) — Chat interface using Tambo

---

##  Demo

-  Video demo: 

- 

---

##  Notes

- Do not commit `.env.local`
- `.env.example` is provided for reference
- This template intentionally keeps scope small to focus on clarity and learning

---

##  Learn More

- [Tambo Docs](https://docs.tambo.co)
- [Resend Docs](https://resend.com/docs)

---

##  Next Steps

Ideas for extending this template:

- Add tone selection (formal / casual)
- Add editable subject regeneration
- Add a confirmation button before sending

Keep extensions minimal and focused.



