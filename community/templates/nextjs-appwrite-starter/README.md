# Tambo + Appwrite Starter

A production-ready starter template for building AI-powered apps with **Next.js 15**, **Appwrite** (Auth/Database), and **Tambo** (Generative UI).

## Features

- ✅ **Pre-configured Auth**: Login/signup forms connected to Appwrite.
- ✅ **Context Bridge**: Automatically passes Appwrite user sessions to the Tambo AI context.
- ✅ **Generative UI**: Example "NoteCard" component registered for AI generation.
- ✅ **Tool Integration**: "create_user_note" tool pre-wired to Appwrite Databases.
- ✅ **Strict TypeScript**: Full type safety.
- ✅ **Clean Slate**: No bloat, ready for your app idea.

## Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router + Turbopack)
- **Authentication**: [Appwrite](https://appwrite.io)
- **Database**: [Appwrite](https://appwrite.io)
- **AI/UI**: [Tambo](https://tambo.co)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Validation**: [Zod](https://zod.dev)

## Prerequisites

### 1. Appwrite Project

1. Create a project at [cloud.appwrite.io](https://cloud.appwrite.io)
2. Go to **Auth → Settings** and enable **Email/Password** authentication

### 2. Database Setup (IMPORTANT - Follow Exactly!)

1. Go to **Databases** → Create Database (note the **Database ID**)
2. Create a Collection named `notes` (note the **Collection ID**)
3. Add **exactly** these 2 attributes:

   | Attribute | Type   | Size | Required | Default |
   | --------- | ------ | ---- | -------- | ------- |
   | `title`   | String | 255  | Yes      | -       |
   | `content` | String | 5000 | Yes      | -       |

4. Go to **Settings → Permissions** and add:
   - Role: `users` → Check: `Create`, `Read`, `Update`, `Delete`

### 3. Tambo API Key

Get your API key from the [Tambo Dashboard](https://app.tambo.co).

## Setup

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Environment Variables**:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   ```env
   NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_APPWRITE_ENDPOINT=your_appwrite_endpoint
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
   NEXT_PUBLIC_APPWRITE_COLLECTION_ID=your_collection_id
   ```

   > 💡 **Find your Appwrite endpoint**: In Appwrite Console → Settings → Copy the **API Endpoint** (e.g., `https://cloud.appwrite.io/v1` or `https://sgp.cloud.appwrite.io/v1`)

3. **Run Development Server**:

   ```bash
   npm run dev
   ```

## Testing the App

1. **Open** `http://localhost:3000`
2. **Sign up** with email and password
3. **Test the AI** by typing: _"Create a note titled 'Shopping List' with 'Milk, Eggs, Bread'"_
4. **Expected result**: A NoteCard UI appears and the note is saved to Appwrite

### Verify in Appwrite Console

1. Go to **Databases → Your Database → notes collection → Documents**
2. You should see your created note with `title` and `content` fields

## Troubleshooting

| Error                            | Cause                                | Solution                                                                 |
| -------------------------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| `Missing required attribute "X"` | Collection has extra required fields | Delete extra attributes from collection, keep only `title` and `content` |
| `User not authorized`            | Collection permissions not set       | Add `users` role with CRUD permissions                                   |
| `Invalid credentials`            | Wrong API key or Project ID          | Double-check `.env.local` values                                         |

## Project Structure

- `src/components/appwrite-tambo-provider.tsx`: Connects Appwrite Auth to Tambo
- `src/lib/tambo.ts`: Register AI components and tools
- `src/lib/appwrite.ts`: Appwrite client configuration
