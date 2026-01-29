import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './lib/auth'
import { db } from './db/db'
import { product, cartItem } from './db/schema'
import { eq, and } from 'drizzle-orm'

const app = new Hono()

// Enable CORS for the frontend
app.use('*', cors({
  origin: 'http://localhost:3000',
  credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
		allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
		exposeHeaders: ["Content-Length", "X-Request-Id"],
		maxAge: 600,
}))

// Mount Better Auth routes and log request origin for debugging
app.on(['POST', 'GET'], '/api/auth/**', async (c) => {
  try {
    const origin = c.req.header('origin') || c.req.header('Origin')
    const referer = c.req.header('referer') || c.req.header('Referer')
    console.log('[Auth Request] method=', c.req.method, 'path=', c.req.path, 'origin=', origin, 'referer=', referer)
  } catch (e) {
    // ignore logging errors
  }
  return auth.handler(c.req.raw)
})

app.get('/', (c) => {
  return c.json({ message: 'Better Auth + Hono + Drizzle Server' })
})

// Products API
app.get('/api/products', async (c) => {
  try {
    const products = await db.select().from(product)
    return c.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return c.json({ error: 'Failed to fetch products' }, 500)
  }
})

app.post('/api/products/seed', async (c) => {
  try {
    // Seed some demo products
    const demoProducts = [
      {
        id: 'prod-1',
        name: 'Wireless Headphones',
        description: 'Premium noise-cancelling wireless headphones',
        price: '199.99',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        stock: 15,
      },
      {
        id: 'prod-2',
        name: 'Smart Watch',
        description: 'Fitness tracking smartwatch',
        price: '299.99',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        stock: 8,
      },
      {
        id: 'prod-3',
        name: 'Laptop Stand',
        description: 'Ergonomic aluminum laptop stand',
        price: '49.99',
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
        stock: 25,
      },
      {
        id: 'prod-4',
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical gaming keyboard',
        price: '149.99',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
        stock: 12,
      },
      {
        id: 'prod-5',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        price: '59.99',
        image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400',
        stock: 20,
      },
      {
        id: 'prod-6',
        name: 'USB-C Hub',
        description: 'Multi-port USB-C adapter',
        price: '39.99',
        image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400',
        stock: 30,
      },
    ]

    for (const prod of demoProducts) {
      await db.insert(product).values(prod).onConflictDoNothing()
    }

    return c.json({ message: 'Products seeded successfully', count: demoProducts.length })
  } catch (error) {
    console.error('Error seeding products:', error)
    return c.json({ error: 'Failed to seed products' }, 500)
  }
})

// Cart API
app.get('/api/cart/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const items = await db
      .select({
        id: cartItem.id,
        quantity: cartItem.quantity,
        productId: cartItem.productId,
        productName: product.name,
        productPrice: product.price,
        productImage: product.image,
      })
      .from(cartItem)
      .leftJoin(product, eq(cartItem.productId, product.id))
      .where(eq(cartItem.userId, userId))
    
    return c.json(items)
  } catch (error) {
    console.error('Error fetching cart:', error)
    return c.json({ error: 'Failed to fetch cart' }, 500)
  }
})

app.post('/api/cart', async (c) => {
  try {
    const { userId, productId, quantity } = await c.req.json()
    
    // Check if item already in cart
    const existing = await db
      .select()
      .from(cartItem)
      .where(and(eq(cartItem.userId, userId), eq(cartItem.productId, productId)))
      .limit(1)
    
    if (existing.length > 0) {
      // Update quantity
      await db
        .update(cartItem)
        .set({ 
          quantity: existing[0].quantity + quantity,
          updatedAt: new Date()
        })
        .where(eq(cartItem.id, existing[0].id))
      
      return c.json({ message: 'Cart updated', id: existing[0].id })
    } else {
      // Create new cart item
      const id = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      await db.insert(cartItem).values({
        id,
        userId,
        productId,
        quantity,
      })
      
      return c.json({ message: 'Added to cart', id })
    }
  } catch (error) {
    console.error('Error adding to cart:', error)
    return c.json({ error: 'Failed to add to cart' }, 500)
  }
})

app.delete('/api/cart/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await db.delete(cartItem).where(eq(cartItem.id, id))
    return c.json({ message: 'Item removed from cart' })
  } catch (error) {
    console.error('Error removing from cart:', error)
    return c.json({ error: 'Failed to remove item' }, 500)
  }
})

app.put('/api/cart/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { quantity } = await c.req.json()
    
    await db
      .update(cartItem)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItem.id, id))
    
    return c.json({ message: 'Cart item updated' })
  } catch (error) {
    console.error('Error updating cart item:', error)
    return c.json({ error: 'Failed to update item' }, 500)
  }
})

export default app
