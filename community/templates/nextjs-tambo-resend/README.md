# Next.js + Tambo + Resend + Superbase -- AI Email Assistant

**A Next.js starter template that uses Tambo to draft, preview, and send emails via Resend using natural language.**

This template demonstrates how to use **Tambo** to generate UI and execute real-world actions by drafting and sending emails through **Resend**. It includes full authentication and database management with **Superbase**, contact management, and email tracking.

It is designed to give new Tambo users a clear, end-to-end example of:
- a **generative UI component**
- a **tool with real side effects**
- an **AI-controlled interaction flow**
- **user authentication & sessions**
- **data persistence with Supabase**

---

## What This Template Demonstrates

- **Generative Component**  
  The AI renders an `EmailPreview` component to show a draft email.

- **Tool with Side Effects**  
  The AI can call a `sendEmail` tool to send a real email using Resend.

- **AI-Controlled Flow**  
  Natural language → UI preview → user confirmation → email sent.

- **Authentication & Session Management**  
  Passwordless OTP-based authentication using Supabase Auth with secure session handling.

- **Contact Management**  
  Save, list, and manage contacts with automatic duplicate detection.

- **Email Tracking**  
  Track sent and draft emails with full audit trails.

- **Sidebar Data Views**  
  Sent emails, draft emails, and contacts are visible in the sidebar UI alongside the chat.


This is a minimal but complete starter showing how Tambo can both **render UI** and **trigger real-world actions** with persistent data.

---

## Tech Stack

- **Next.js 15** (App Router)
- **Tambo** (AI-controlled UI + tools)
- **Resend** (email delivery)
- **Supabase** (authentication & database)
- **Zod** (tool & component schemas)
- **TypeScript**

---

## Getting Started

### Quick Setup

```bash
cd community/templates/nextjs-tambo-resend
npm install
cp example.env.local .env.local
npm run dev
Open http://localhost:3000
```

### Environment Configuration

Add the following variables to your `.env.local` file:

```env
# Tambo AI Configuration
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key

# Resend Email Service
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=onboarding@resend.dev

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Key Configuration Details

- **Tambo API Key**: Get from [Tambo Dashboard](https://tambo.co)
- **Resend API Key**: Get from [Resend Dashboard](https://resend.com) - you can use `onboarding@resend.dev` for development without domain verification
- **Supabase URL & Key**: Get from [Supabase Dashboard](https://supabase.com) - create a new project and find these in the project settings

---

## Authentication & Session Management

### How Authentication Works

The application uses **Supabase Auth** with passwordless OTP (One-Time Password) authentication:

1. **Login Flow**
   - User enters email on the login page (`/login`)
   - Supabase sends a secure sign-in link via email
   - User clicks the link, which redirects to `/chat` with a session token
   - Session is stored in cookies via Supabase SSR middleware

2. **Session Persistence**
   - Sessions are managed using Supabase's cookie-based SSR pattern
   - The `AuthGate` component (`src/components/auth/AuthGate.tsx`) protects routes
   - On app load, `AuthGate` checks if a valid session exists
   - If no session, user is redirected to `/login`
   - Sessions persist across browser refreshes

3. **Client-Side Integration**
   - Browser client created in `src/lib/superbase/client.ts`
   - Automatically manages cookies for session tokens
   - Cookies are sent with all API requests

4. **Server-Side Integration**
   - Server client created in `src/lib/superbase/server.ts`
   - Used in server actions for authenticated database operations
   - Always retrieves the current authenticated user via `supabase.auth.getUser()`

### Key Files
- **`src/app/login/page.tsx`** - Login page with OTP email flow
- **`src/components/auth/AuthGate.tsx`** - Route protection wrapper
- **`src/lib/superbase/client.ts`** - Browser Supabase client with cookie handling
- **`src/lib/superbase/server.ts`** - Server Supabase client

---

## Database & Data Storage

### Supabase as Backend

This application uses **Supabase** (PostgreSQL-based) to store user data securely:

#### Database Tables

1. **`users`** (Managed by Supabase Auth)
   - `id` (UUID) - Primary key
   - `email` (string) - User's email address
   - Auto-managed by Supabase authentication

2. **`contacts`** (User-created contacts)
   ```
   - id (UUID) - Primary key
   - user_id (UUID) - Foreign key to users
   - name (string) - Contact name
   - email (string) - Contact email
   - created_at (timestamp) - Creation timestamp
   - Indexes: (user_id, email) for duplicate detection
   ```

3. **`emails`** (Email tracking - sent & draft)
   ```
   - id (UUID) - Primary key
   - user_id (UUID) - Foreign key to users
   - to_email (string) - Recipient email
   - subject (string) - Email subject
   - body (string) - Email body content
   - status (enum: 'draft' | 'sent') - Email status
   - created_at (timestamp) - Creation timestamp
   - Indexes: (user_id, status) for filtering
   ```

### Row Level Security (RLS)

All tables have RLS policies enabled to ensure:
- Users can only see their own data
- Each query is automatically filtered by `user_id`
- Data is isolated per user

### Setting Up Database

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run the setup migration to create tables
3. Enable RLS on all tables
4. Copy your project URL and anon key to `.env.local`

---

## Contact Management

### How Contacts Are Stored & Managed

Contacts are stored in the Supabase `contacts` table with the following features:

#### Saving a Contact
```typescript
// src/services/save-contact.ts
- Requires authentication
- Automatically associates contact with current user
- Prevents duplicate emails for the same user
- Returns status: 'saved' or 'exists'
```

**Usage in Chat:**
```
"Save John Doe's email john@example.com"
"Add contact: jane@company.com (Jane Smith)"
```

#### Listing Contacts
```typescript
// src/services/list-contacts.ts
- Retrieves all contacts for authenticated user
- Returns sorted list of contact names and emails
- Used to populate contact suggestions in the AI
```

#### Contact Features
- ✅ Automatic duplicate detection (same user can't add same email twice)
- ✅ User isolation (each user's contacts are private)
- ✅ Timestamp tracking (know when contact was added)
- ✅ Full name storage (not just email)

#### Interacting with Contacts
Ask the AI to:
- "Show me my contacts"
- "Add contact john@example.com as John Doe"
- "Who are my current contacts?"

---

## Email Management - Sent & Draft Emails

### How Emails Are Tracked

All emails (sent and draft) are stored in the Supabase `emails` table with full audit trails:

#### Saving Draft Emails
```typescript
// src/services/save-email.ts
- Called before sending to create a draft
- Stores recipient, subject, body, and status='draft'
- User can review before confirming send
- Draft updates the status to 'sent' with timestamp
```

#### Viewing Email Status

Users can view their emails by status:

1. **Draft Emails** (`/emails?status=draft`)
   - Unsent email proposals from the AI
   - User can ask AI to modify before sending
   - Automatically deleted after sending or if user declines

2. **Sent Emails** (`/emails?status=sent`)
   - Successfully delivered emails via Resend
   - Complete history with timestamps
   - Recipient email and full content preserved

#### Email Features
- ✅ Full email content stored (subject + body)
- ✅ Recipient tracking (to_email)
- ✅ Status filtering (sent vs. draft)
- ✅ Timestamp history (know when sent)
- ✅ User isolation (private email history)

#### Listing Emails
```typescript
// src/services/list-emails.ts
- Retrieves emails for authenticated user
- Optional filter by status: 'sent' | 'draft'
- Ordered by creation date (newest first)
- Returns: id, to, subject, body, status, createdAt
```

#### Workflow
1. User requests draft email in chat: *"Write an email to john@example.com about..."*
2. AI generates email and renders `EmailPreview` component
3. Draft email is saved to database with `status='draft'`
4. User confirms: *"Send this email"*
5. `sendEmail` tool is triggered via Resend API
6. Email status changes to `'sent'` in database
7. Confirmation message shown to user
8. Email history updated immediately

#### Interacting with Emails
Ask the AI to:
- "Show me my sent emails"
- "What drafts do I have?"
- "List emails sent to jane@example.com"
- "Did I send that follow-up email?"

### Sidebar Views (Sent, Drafts & Contacts)

In addition to AI-driven chat workflows, this template includes a **minimal sidebar UI** that surfaces persisted data:

- **Sent Emails**  
  View all emails that have been successfully sent via Resend.

- **Draft Emails**  
  View saved drafts that were generated by the AI but not yet sent.

- **Contacts**  
  View saved contacts associated with the authenticated user.

These views are accessible directly from the **thread history sidebar**, allowing users to inspect and reuse data without requiring additional prompts.

This demonstrates how **AI-controlled actions** and **traditional UI patterns** can coexist:
- The AI creates and acts on data
- The sidebar provides deterministic access to that same data

---

## Try It Out

In the chat, try:

1. **Add a Contact**  
   Example: "Save contact: john@example.com as John Smith"

2. **Draft an Email**  
   Example: "Write a polite internship follow-up email to john@example.com. Keep it professional and concise."

3. **Preview the Email**  
   The AI renders an `EmailPreview` showing:
   - Recipient email
   - Subject line
   - Full email body

4. **Send the Email**  
   Say: "Send this email"
   - Email is sent via Resend
   - Status updated to 'sent' in database
   - Confirmation message displayed

5. **View Email History**  
   Say: "Show me my sent emails" or "What drafts do I have?"

6. **Manage Contacts**  
   Say: "Who are my contacts?" or "Add contact: jane@company.com"

---

## How It Works

### Key Components

- **`EmailPreview` Component**  
  Registered as a Tambo component and rendered dynamically by the AI to display the drafted email.

- **`sendEmail` Tool**  
  Registered as a Tambo tool and implemented using Resend's API to send real emails.

- **`saveContact` & `listContacts` Tools**  
  Manage contact storage and retrieval from Supabase.

- **`saveEmailDraft` & `listEmails` Tools**  
  Track email history with sent/draft status.

- **`TamboProvider`**  
  Connects registered components and tools, allowing the AI to decide what to render and when to act.

- **`AuthGate` Component**  
  Protects all routes by requiring an active Supabase session.

### Explore the Code

- **`src/components/tambo/EmailPreview.tsx`**  
  AI-rendered email preview component.

- **`src/components/auth/AuthGate.tsx`**  
  Session validation and route protection.

- **`src/lib/superbase/`**  
  Supabase client setup for browser and server.

- **`src/services/`**  
  All database operations:
  - `save-contact.ts` - Add new contacts
  - `list-contacts.ts` - Retrieve user contacts
  - `save-email.ts` - Store email drafts/sends
  - `list-emails.ts` - Retrieve email history
  - `send-email-and-persist.ts` - Send via Resend + update database
  - `find-contact.ts` - Search for specific contacts

- **`src/lib/tambo.ts`**  
  Central registration of Tambo components and tools.

- **`src/app/chat/page.tsx`**  
  Chat interface powered by Tambo.

---

## Database Schema

### Quick Setup in Supabase

Run these SQL commands in the Supabase SQL Editor:

```sql
-- Create contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Create emails table
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'sent')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "Users see only their contacts" 
  ON contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" 
  ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" 
  ON contacts FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for emails
CREATE POLICY "Users see only their emails" 
  ON emails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emails" 
  ON emails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emails" 
  ON emails FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_emails_status ON emails(user_id, status);
```

---

## Media
- **Screenshot:**

![Email preview rendered in chat](https://github.com/user-attachments/assets/e57c660d-a219-430e-8a61-4095892993b6)

![Email sent confirmation](https://github.com/user-attachments/assets/7633e3b4-773d-42a7-b659-59b6d612c84a)

![page ](https://github.com/user-attachments/assets/eee0edef-1d2f-41dd-919a-0a3b477ff9cf)

### Demo

- **Video demo:**
- https://github.com/user-attachments/assets/eb948c79-ed8f-4df5-be5d-efa3233bc75b

- https://github.com/user-attachments/assets/1d809c0d-f0da-41d5-a991-0674f8cd5f2e


## Notes

- Do not commit `.env.local`.
- `.env.example` is provided for reference.
- This template intentionally keeps scope manageable to focus on clarity and learning.

---

## Learn More

- **[Tambo Docs](https://docs.tambo.co)**
- **[Resend Docs](https://resend.com/docs)**
- **[Supabase Auth Docs](https://supabase.com/docs/guides/auth)**
- **[Supabase Database Docs](https://supabase.com/docs/guides/database)**
