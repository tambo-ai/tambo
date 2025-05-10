import { ToolCallRequest } from "@tambo-ai-cloud/core";
import {
  JSONSchema7,
  JSONSchema7Definition,
  JSONSchema7Object,
} from "json-schema";
import OpenAI from "openai";

export function unstrictifyToolCallRequest(
  originalTool: OpenAI.Chat.Completions.ChatCompletionTool | undefined,
  toolCallRequest: ToolCallRequest | undefined,
): ToolCallRequest | undefined {
  if (!originalTool || !toolCallRequest) {
    return toolCallRequest;
  }

  const originalToolParams = (originalTool.function.parameters ??
    {}) as JSONSchema7Object;
  const params = Object.fromEntries(
    toolCallRequest.parameters.map(({ parameterName, parameterValue }) => {
      return [parameterName, parameterValue] as const;
    }),
  );
  const newParamsRecord = unstrictifyToolCallParams(
    originalToolParams as JSONSchema7,
    params,
  );

  const newParams = Object.entries(newParamsRecord).map(
    ([parameterName, parameterValue]) => {
      return { parameterName, parameterValue };
    },
  );
  return {
    ...toolCallRequest,
    parameters: newParams,
  };
}
function unstrictifyToolCallParams(
  originalToolParams: JSONSchema7,
  toolCallRequestParams: Record<string, unknown>,
): Record<string, unknown> {
  if (originalToolParams.type !== "object") {
    throw new Error(
      `originalToolParams must be an object, instead got ${originalToolParams.type}`,
    );
  }
  const newParams = Object.entries(toolCallRequestParams)
    .map(([parameterName, parameterValue]) => {
      const isRequired = originalToolParams.required?.includes(parameterName);
      // find the param in the original tool
      const originalParamSchema =
        parameterName in (originalToolParams.properties ?? {})
          ? originalToolParams.properties?.[parameterName]
          : undefined;

      if (!originalParamSchema) {
        throw new Error(
          `Tool call request parameter ${parameterName} not found in original tool`,
        );
      }

      if (
        parameterValue === null &&
        !canBeNull(originalParamSchema) &&
        !isRequired
      ) {
        return undefined;
      }

      // TODO: now recurse into parameterValue, dealing with required: [...]
      // in the original param to determine optional-ness
      if (
        typeof originalParamSchema === "object" &&
        originalParamSchema.type === "object"
      ) {
        // parameter value better itself be an object
        const newParamValue = unstrictifyToolCallParams(
          originalParamSchema,
          parameterValue as Record<string, unknown>,
        );
        return [parameterName, newParamValue] as const;
      }

      return [parameterName, parameterValue] as const;
    })
    .filter((param) => param !== undefined);
  return Object.fromEntries(newParams);
}

function canBeNull(param: JSONSchema7Definition): boolean {
  if (typeof param !== "object") {
    return false;
  }

  if (param.type === "null") {
    return true;
  }

  if (param.anyOf?.some((anyOf) => canBeNull(anyOf))) {
    return true;
  }
  return false;
}
