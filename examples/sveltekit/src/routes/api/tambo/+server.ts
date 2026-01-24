import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const { prompt } = await request.json();

  // NOTE:
  // This is a minimal example. In a real setup,
  // connect this route to your Tambo backend or core logic.
  const response = `Tambo response to: ${prompt}`;

  return new Response(
    JSON.stringify({ response }),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};

