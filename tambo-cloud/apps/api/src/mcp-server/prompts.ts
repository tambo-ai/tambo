import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { MCPClient } from "@tambo-ai-cloud/core";
import Ajv from "ajv";
import { z } from "zod";

const ajv = new Ajv();

/** This is just a wrapper around ajv to convert a JSON schema to a Zod type. */
function zodFromJsonSchema(jsonSchema: object): z.ZodTypeAny {
  const validateFn = ajv.compile(jsonSchema);
  return z.custom((data) => validateFn(data));
}

export async function registerPromptHandlers(
  server: McpServer,
  mcpClients: { client: MCPClient; serverId: string; url: string }[],
) {
  const registrations = await Promise.allSettled(
    mcpClients.map(async ({ client, serverId }) => {
      try {
        // TODO: check if the server supports prompts, but capabilities is always returning undefined?
        // const capabilities = await client.client.getServerCapabilities();
        // console.log("Capabilities:", capabilities);
        const promptResponse = await client.client.listPrompts();

        for (const prompt of promptResponse.prompts) {
          const argsSchema = Object.fromEntries(
            prompt.arguments?.map((arg) => {
              const argZod = zodFromJsonSchema({
                type: arg.type ?? "string",
              });
              const requiredArgZod = arg.required ? argZod : argZod.optional();
              return [arg.name, requiredArgZod] as const;
            }) ?? [],
          );
          server.registerPrompt(
            prompt.name,
            {
              title: prompt.title ?? prompt.name,
              description: prompt.description,

              argsSchema: argsSchema,
            },

            // TODO: prompts without parameters seem to just pass opts as the first arg, so there is no args
            async (argsOrOpts, opts) => {
              const realArgs = (opts as any) ? argsOrOpts : opts;
              const promptResponse = await client.client.getPrompt({
                name: prompt.name,
                arguments: realArgs as any,
              });
              return promptResponse;
            },
          );
        }
      } catch (error) {
        // for some reason getServerCapabilities returns undefined even when the method is available,
        // so we need to assume all servers support prompts right now
        if (
          error instanceof McpError &&
          error.code === ErrorCode.MethodNotFound
        ) {
          return;
        }

        console.error("Error listing prompts for MCP server", serverId, error);
      }
      // TODO: handle prompt updates
      // something like this:
      // client.client.setRequestHandler(
      //   PromptListChangedNotificationSchema,
      //   async () => {
      //     const prompts = await client.client.listPrompts();
      //     // now update the prompts in the server
      //     return {};
      //   },
      // );
    }),
  );
  for (const [index, result] of enumerate(registrations)) {
    const { serverId, url } = mcpClients[index];
    if (result.status === "rejected") {
      console.error(
        "Error listing prompts for MCP server",
        serverId,
        url,
        result.reason,
      );
    } else {
      console.log("Registered prompts from:", serverId, url);
    }
  }

  // TODO: report errors upstream
}

function enumerate<T>(iterable: Iterable<T>): Array<[number, T]> {
  const result: [number, T][] = [];
  let index = 0;
  for (const value of iterable) {
    result.push([index++, value]);
  }
  return result;
}
