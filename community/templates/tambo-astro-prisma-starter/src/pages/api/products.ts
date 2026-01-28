import { PrismaClient } from '@prisma/client';
import type { APIRoute } from 'astro';

export const prerender = false;

const prisma = new PrismaClient();

// Helper to fetch all products for the response
const getAllProducts = async () => {
  return await prisma.product.findMany({
    take: 50,
    orderBy: { id: 'desc' } // Show newest first
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, category, price, tags } = body;

    if (!name || !price) {
      return new Response(JSON.stringify({ error: 'Name and price are required' }), { status: 400 });
    }

    await prisma.product.create({
      data: {
        name,
        category: category || 'Uncategorized',
        price: Number(price),
        tags: tags || '',
      },
    });

    const products = await getAllProducts();
    return new Response(JSON.stringify(products), { status: 200 });
  } catch (error) {
    console.error('Create error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create product' }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name, price, tags } = body;

    let targetId = id;
    
    // If name is provided but no ID, try to find by name (fuzzy)
    if (!targetId && name) {
      const existing = await prisma.product.findFirst({
        where: { name: { contains: name } }
      });
      if (existing) targetId = existing.id;
    }

    if (!targetId) {
      return new Response(JSON.stringify({ error: 'Product not found (need ID or valid name)' }), { status: 404 });
    }

    const data: any = {};
    if (price !== undefined) data.price = Number(price);
    if (tags !== undefined) data.tags = tags;
    // We could allow name updates too but usually we just update props

    await prisma.product.update({
      where: { id: Number(targetId) },
      data,
    });

    const products = await getAllProducts();
    return new Response(JSON.stringify(products), { status: 200 });
  } catch (error) {
    console.error('Update error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update product' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name } = body;
    
    let targetId = id;

    if (!targetId && name) {
      const existing = await prisma.product.findFirst({
         where: { name: { contains: name } }
      });
      if (existing) targetId = existing.id;
    }

    if (!targetId) {
       return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }

    await prisma.product.delete({
      where: { id: Number(targetId) },
    });

    const products = await getAllProducts();
    return new Response(JSON.stringify(products), { status: 200 });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete product' }), { status: 500 });
  }
};
