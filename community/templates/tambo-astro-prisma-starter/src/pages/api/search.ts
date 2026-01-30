import { Prisma, PrismaClient } from '@prisma/client';
import type { APIRoute } from 'astro';

const prisma = new PrismaClient();

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const useCase = url.searchParams.get('useCase');
  const category = url.searchParams.get('category');
  const maxPrice = url.searchParams.get('maxPrice');

  console.log('API Search:', { useCase, category, maxPrice });

  try {
    const where: Prisma.ProductWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (maxPrice) {
      where.price = { lte: parseInt(maxPrice) };
    }

    if (useCase) {
      // Split into terms to handle "gaming laptop" (matches "gaming" OR "laptop")
      const terms = useCase.toLowerCase().split(" ").filter((t: string) => t.length > 2);
      if (terms.length > 0) {
        where.OR = terms.map((term: string) => ({
          tags: { contains: term },
        }));
      }
    }

    const products = await prisma.product.findMany({
      where,
      take: 50,
    });

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ error: 'Database search failed' }), { status: 500 });
  }
};
