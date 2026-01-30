# Tambo + Appwrite Starter

A minimal starter template for building AI-powered apps with **Next.js 15**, **Appwrite**, and **Tambo**.

## Screenshot

<!-- TODO: Add screenshot before PR submission -->

![App Screenshot](screenshot1.png)

## Video Demo

<!-- TODO: Add video demo link before PR submission -->

[Watch the demo video](VIDEO_LINK)

## What's Included

- **Next.js 15** - App Router + Turbopack for fast development
- **Appwrite** - Authentication (Email/Password) and Database
- **Tambo** - Generative UI components and AI tools
- **Tailwind CSS v4** - Styling with semantic design tokens
- **TypeScript** - Strict mode enabled

## Prerequisites

1. **Tambo API Key** - Get from [tambo.co/dashboard](https://app.tambo.co/dashboard)
2. **Appwrite Account** - Create at [cloud.appwrite.io](https://cloud.appwrite.io)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_ENDPOINT=your_appwrite_endpoint
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_COLLECTION_ID=your_collection_id
```

> 💡 Find your **Appwrite endpoint** in Appwrite Console → Settings → API Endpoint

### 3. Setup Appwrite Database

1. Go to **Databases** → Create Database (note the **Database ID**)
2. Create a Collection named `notes` (note the **Collection ID**)
3. Add these attributes:

   | Attribute | Type   | Size | Required |
   | --------- | ------ | ---- | -------- |
   | `title`   | String | 255  | Yes      |
   | `content` | String | 5000 | Yes      |

4. Go to **Settings → Permissions** → Add role `users` with Create, Read, Update, Delete

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing

1. Sign up with email/password
2. Ask the AI: _"Create a note titled 'Shopping List' with 'Milk, Eggs, Bread'"_
3. Verify the NoteCard appears and the note is saved in Appwrite Console

## Project Structure

```text
src/
├── app/                    # Next.js App Router
│   ├── (auth)/login/       # Login page
│   └── page.tsx            # Main chat page
├── components/
│   ├── tambo/              # Tambo components
│   │   └── NoteCard.tsx    # AI-generated note component
│   └── ui/                 # UI primitives
└── lib/
    ├── tambo.ts            # Component & tool registration
    └── appwrite.ts         # Appwrite client
```

## Customization

### Add Components

Register components in `src/lib/tambo.ts`:

```tsx
export const components: TamboComponent[] = [
  {
    name: "NoteCard",
    description: "Displays a note with title and content",
    component: NoteCard,
    propsSchema: noteCardSchema,
  },
];
```

### Add Tools

Register tools in `src/lib/tambo.ts`:

```tsx
export const tools: TamboTool[] = [
  {
    name: "create_user_note",
    description: "Creates a note in Appwrite",
    tool: createUserNote,
    inputSchema: z.object({ title: z.string(), content: z.string() }),
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
];
```

## Troubleshooting

| Error                        | Solution                                                   |
| ---------------------------- | ---------------------------------------------------------- |
| `Missing required attribute` | Check collection has only `title` and `content` attributes |
| `User not authorized`        | Add `users` role permissions in Appwrite                   |
| `Network error`              | Verify Appwrite endpoint in `.env.local`                   |

## Learn More

- [Tambo Documentation](https://docs.tambo.co)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
