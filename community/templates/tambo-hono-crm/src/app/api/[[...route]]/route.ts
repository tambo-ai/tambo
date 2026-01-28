import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { z } from 'zod';
import { db, contacts } from '../../../db';

const app = new Hono().basePath('/api');

const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

app.get('/contacts', async (c) => {
  try {
    const allContacts = await db.select().from(contacts);
    return c.json(allContacts);
  } catch (_error) {
    return c.json({ error: 'Failed to fetch contacts' }, 500);
  }
});

app.post('/contacts', async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = createContactSchema.parse(body);
    
    const [newContact] = await db.insert(contacts).values(validatedData).returning();
    return c.json(newContact, 201);
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: _error.errors }, 400);
    }
    return c.json({ error: 'Failed to create contact' }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
