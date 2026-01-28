import { Hono } from 'hono'
import { handle } from 'hono/vercel'

export const runtime = 'edge'
const app = new Hono().basePath('/api')

// Minimal in-memory store for the "10-minute guttable" requirement
let tasks = [
  { id: "1", title: "Setup Hono Template", status: "completed" },
  { id: "2", title: "Submit to Tambo Hackathon", status: "pending" }
]

app.get('/tasks', (c) => c.json(tasks))

app.post('/tasks', async (c) => {
  const { title } = await c.req.json()
  const newTask = { id: Math.random().toString(36).substring(7), title, status: 'pending' }
  tasks.push(newTask)
  return c.json(newTask, 201)
})

export const GET = handle(app)
export const POST = handle(app)