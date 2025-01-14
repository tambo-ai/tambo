# Hydra API

1. make a `.env` file with contents I will send you

1. make a `firestore-creds.json` file at root with contents I will send you

1. `npm i`

1. `npm run dev`

1. `localhost:3000/api`

## Instructions

go to `/api` to find the Swagger UI. You can use the `authenticate` button to set your `x-api-key` header before any request.

### Intro

Main routes can be found in the controller in `/src/components/components.controller.ts` and are:

- /components/generate
- /components/hydrate

These routes require a valid api key in the `x-api-key` header. These api keys encode the projectId, and a list of valid keys for each project is stored in the firestore db.

However, you can't just copy/paste one of the keys from firestore, since all keys are hashed before being stored. Use the generate token route under the Projects controller to get a usable key in the response.

To use any of the project routes, you should authenticate using an Admin Key (in the env file i'll provide). Later these project routes will instead be protected by user auth tokens.

Projects also have a list of ProviderKeys. For now, the api expects a project to have a single providerKey that is for openai.

### Steps for testing:

1. Auth with an Admin key

2. Create a Project

Use the `POST /projects` route with whatever data

3. Add a provider key for that project

Use the `PUT projects/id/provider-key` route, with `openai` as providerName, and an openai api key as providerKey

4. Generate an api key for that project

Use the `PUT projects/id/api-key/...` route. Use any data for userId and name for now. Copy the key in the response

5. Authenticate using the api key you generated

6. Start using the /components/ routes! Or more realistically, have a demo project use the API by adding api key in the HydraClient constructor, like:
   `const hydra = new HydraClient(undefined, undefined, "key", url)`

   (will update so undefined not needed here...)
