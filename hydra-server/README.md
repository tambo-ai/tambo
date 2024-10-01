# hydra-ai-server

A package for self-hosting hydra backend code.
Wrap this package with your own API routes, and call those routes from your client app which uses the `hydra-ai` package.

If you don't want to self-host hydra on your backend, use the hosted Hydra API.

## Getting Started

1. **Install the package**

   ```shell
   npm i hydra-ai-backend
   ```

2. **Initialize HydraBackend**

   Create a new instance of `HydraBackend`. Add an OpenAI key in the constructor:

   ```typescript
   import { HydraBackend } from "hydra-ai-backend";
   const hydraBackend = new HydraBackend("openai-key-here");
   ```

3. **Make routes for generateComponent and hydrateComponent**

   Your client-side app that uses `hydra-ai` will have constructed the HydraClient with callback functions for generating components and hydrating components. Those callbacks need to call `HydraBackend` functions: `generateComponent` and `hydrateComponentWithData`.

   If you are self-hosting HydraBackend, the idea is to have an API route for each of these functions, and have your client-side callback functions request these routes. Essentially, you are connecting the client-side callback functions to the backend functions through an API.

   For example, using NestJS you might have a controller with routes like:

   ```typescript
    @Post('generate')
    async generateComponent(
        @Body() generateComponentDto: GenerateComponentDto,
    ) {
        return hydraBackend.generateComponent(
            generateComponentDto.messageHistory,
            generateComponentDto.availableComponents,
        );
    }

    @Post('hydrate')
    async hydrateComponent(
        @Body() hydrateComponentDto: HydrateComponentDto,
    ) {
        return hydraBackend.hydrateComponentWithData(
            hydrateComponentDto.messageHistory,
            hydrateComponentDto.component,
            hydrateComponentDto.toolResponse,
        );
    }
   ```

   Of course, you can protect these routes with tokens/api keys/etc.

4. **Connect your client app to your routes**

   Now that you have backend routes setup to handle hydra requests, you can setup your frontend HydraClient to use them.

   ```typescript
   const BASE_URL = "your-api-url";

   export const getComponentChoice = async (
     messageHistory: ChatMessage[],
     availableComponents: AvailableComponents
   ): Promise<ComponentDecision> => {
     try {
       const response = await fetch(`${BASE_URL}/generate`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           messageHistory,
           availableComponents,
         }),
       });

       if (!response.ok) {
         throw new Error("Failed to generate component");
       }

       const result = await response.json();
       return result as ComponentDecision;
     } catch (error) {
       console.error("Error in hydraGenerate:", error);
       throw error;
     }
   };

   export const hydrateComponent = async (
     messageHistory: ChatMessage[],
     component: AvailableComponent,
     toolResponse: any
   ): Promise<ComponentChoice> => {
     try {
       const response = await fetch(`${BASE_URL}/hydrate`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           messageHistory,
           component,
           toolResponse,
         }),
       });

       if (!response.ok) {
         throw new Error("Failed to hydrate component");
       }

       const result = await response.json();
       return result as ComponentChoice;
     } catch (error) {
       console.error("Error in hydraHydrate:", error);
       throw error;
     }
   };

   const hydraClient = new HydraClient({
     getComponentChoice: getComponentChoice,
     hydrateComponentWithToolResponse: hydrateComponent,
   });

   const { component, message } = await hydra.generateComponent(userMessage);
   ```

## Report a bug or Request a feature

Make a GitHub issue [here.](https://github.com/michaelmagan/hydraai/issues/new)
