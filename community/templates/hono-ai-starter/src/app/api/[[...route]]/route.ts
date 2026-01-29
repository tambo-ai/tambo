import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const runtime = 'edge';

const app = new Hono().basePath('/api');

// 1. Data Contract matching TaskList.tsx and lib/tambo.ts
let tasks = [
  { id: "1", title: "Integrate Hono Edge", completed: true },
  { id: "2", title: "Register Generative UI Components", completed: false }
];

// 2. Fetch Tasks
app.get('/tasks', (c) => {
  return c.json(tasks);
});

// 3. Add Task with Zod Validation
app.post(
  '/tasks',
  zValidator(
    'json',
    z.object({
      title: z.string().min(1).describe("The name of the task to be added")
    })
  ),
  async (c) => {
    const { title } = c.req.valid('json');
    
    const newTask = { 
      id: crypto.randomUUID(), // More robust than Math.random
      title, 
      completed: false 
    };
    
    tasks = [newTask, ...tasks]; // Push to top for better UI feel
    return c.json(newTask, 201);
  }
);

export const GET = handle(app);
export const POST = handle(app);