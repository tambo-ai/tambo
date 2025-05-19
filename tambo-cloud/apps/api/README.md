# Hydra API

1. Create a `.env` file with the values I will send you.
2. Run `npm i`.
3. Start the dev server with `npm run dev`.
4. Visit `http://localhost:3000/api` for the Swagger UI.

## Instructions

Open `/api` in the browser to see the Swagger UI. Use the **Authorize** button to set your `x-api-key` header before making any request.

### Intro

Key component routes (defined in `/src/components/components.controller.ts`) are:

- `POST /components/generate`
- `POST /components/hydrate`

These routes require a valid API key in the `x-api-key` header.  
API keys are generated through the Projects controller and are stored securely in the database (hashed at rest).

To manage projects:

1. Authenticate with an **Admin Key** (defined in your `.env`).
2. Create a project with `POST /projects`.
3. Add a provider key to the project with `PUT /projects/{id}/provider-key` (currently only `openai` is supported).
4. Generate an API key for your project with `PUT /projects/{id}/api-key`.
5. Use the generated API key when calling component routes or when instantiating a client, e.g.:

   ```ts
   const hydra = new HydraClient(undefined, undefined, "your-api-key", apiUrl);
   ```

That’s it—no Firestore credentials are required anymore.
