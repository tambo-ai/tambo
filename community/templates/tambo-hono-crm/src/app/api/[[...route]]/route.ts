export const runtime = "nodejs";

import { Hono } from "hono";
import { handle } from "hono/vercel";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../../db/db";
import { contacts } from "../../../db/schema";

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

    const [newContact] = await db
      .insert(contacts)
      .values(validatedData)
      .returning();
    return c.json(newContact, 201);
  } catch (_error) {
    return c.json({ error: "Failed to create contact" }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
