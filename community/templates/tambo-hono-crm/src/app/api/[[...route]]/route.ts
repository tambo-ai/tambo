export const runtime = "nodejs";

import { Hono } from "hono";
import { handle } from "hono/vercel";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, contacts } from '../../../db';

const app = new Hono().basePath("/api");

const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

app.get("/contacts", async (c) => {
  try {
    const allContacts = await db.select().from(contacts);
    return c.json(allContacts);
  } catch (_error) {
    return c.json({ error: "Failed to fetch contacts" }, 500);
  }
});

app.post("/contacts", zValidator("json", createContactSchema), async (c) => {
  try {
    const validatedData = c.req.valid("json");
    const { name, email, company, notes } = validatedData;

    await db.insert(contacts).values({ name, email, company, notes });
    
    return c.json({ 
      success: true, 
      message: `Contact ${name} has been successfully saved to the database.`,
      contact: { name, email, company, notes } 
    }, 201);
  } catch (error) {
    console.error("DATABASE ERROR:", error);
    return c.json({ error: "Failed to create contact" }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
