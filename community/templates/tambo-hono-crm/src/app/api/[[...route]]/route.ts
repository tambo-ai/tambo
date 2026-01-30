export const runtime = "nodejs";

import { Hono } from "hono";
import { handle } from "hono/vercel";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { like, eq } from "drizzle-orm";
import { db, contacts } from "../../../db";

const app = new Hono().basePath("/api");

const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

const updateContactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

const searchContactsSchema = z.object({
  query: z.string().optional(),
});

app.get("/contacts", zValidator("query", searchContactsSchema), async (c) => {
  try {
    const { query } = c.req.valid("query");

    let allContacts;
    if (query) {
      allContacts = await db
        .select()
        .from(contacts)
        .where(like(contacts.name, `%${query}%`));
    } else {
      allContacts = await db.select().from(contacts);
    }

    return c.json(allContacts);
  } catch (error) {
    console.error("DATABASE ERROR:", error);
    return c.json({ error: "Failed to fetch contacts" }, 500);
  }
});

app.post("/contacts", zValidator("json", createContactSchema), async (c) => {
  try {
    const validatedData = c.req.valid("json");
    const { name, email, company, notes } = validatedData;

    await db.insert(contacts).values({ name, email, company, notes });

    return c.json(
      {
        success: true,
        message: `Contact ${name} has been successfully saved to the database.`,
        contact: { name, email, company, notes },
      },
      201,
    );
  } catch (error) {
    console.error("DATABASE ERROR:", error);
    return c.json({ error: "Failed to create contact" }, 500);
  }
});

app.patch(
  "/contacts/:id",
  zValidator("json", updateContactSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const validatedData = c.req.valid("json");

      await db.update(contacts).set(validatedData).where(eq(contacts.id, id));

      return c.json({
        success: true,
        message: `Contact updated successfully.`,
        id,
      });
    } catch (error) {
      console.error("DATABASE ERROR:", error);
      return c.json({ error: "Failed to update contact" }, 500);
    }
  },
);

app.delete("/contacts/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "Invalid contact ID" }, 400);
    }

    await db.delete(contacts).where(eq(contacts.id, id));

    return c.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error("DELETE CONTACT ERROR:", error);
    return c.json({ error: "Failed to delete contact" }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
