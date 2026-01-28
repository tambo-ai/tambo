# Appwrite Setup Guide

This guide walks you through setting up Appwrite for the Tambo + Appwrite Database Starter template.

## Step 1: Create Appwrite Project

1. Go to [https://cloud.appwrite.io/](https://cloud.appwrite.io/)
2. Log in to your account
3. Click the **Create Project** button
4. Enter your project name
5. Click **Create**

## Step 2: Set Up Database

1. Click **Database** in the left sidebar
2. Click **Create Database**
3. Enter database name (e.g., `main`)
4. **Important**: Copy your database ID and save it somewhere safe
5. Click **Create**

## Step 3: Create Collection

1. Click **Create Collection**
2. Enter collection name: `notes`
3. Click **Create**

## Step 4: Add Attributes

Add the following attributes to your collection:

1. **title**
   - Type: String
   - Required: Yes
   
2. **content**
   - Type: String
   - Required: No

## Step 5: Connect to Template

1. Click **Get Started** at the top left
2. Click **Web**
3. Select **Next.js**
4. Click **Create Platform** button

## Step 6: Configure Environment Variables

1. In the dotenv section, copy the credentials
2. Create `.env.local` file in your project root:
   ```bash
   cp .env.example .env.local
   ```
3. Replace the values in `.env.local`:
   ```
   NEXT_PUBLIC_APPWRITE_ENDPOINT=your-endpoint
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
   APPWRITE_API_KEY=your-api-key
   APPWRITE_DATABASE_ID=your-database-id
   ```

## You're Ready!

Your Appwrite setup is complete. Run `npm run dev` to start using the template with AI-powered database operations.
