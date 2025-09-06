/**
 * Unit tests for custom LLM parameters functionality
 * Tests merge logic, validation, and parameter separation
 */

import {
  CustomLlmParams,
  mergeModelParams,
  validateCustomParams,
  RESERVED_PARAM_KEYS,
  STANDARD_PARAM_KEYS,
} from "../custom-llm-params";

describe("Custom LLM Parameters", () => {
  describe("mergeModelParams", () => {
    it("should merge parameters with correct precedence (defaults < project < request)", () => {
      const defaults: CustomLlmParams = {
        temperature: 0.7,
        max_tokens: 1000,
        custom_param: "default_value",
      };

      const projectParams: CustomLlmParams = {
        temperature: 0.8,
        top_p: 0.9,
        custom_param: "project_value",
      };

      const requestOverrides: CustomLlmParams = {
        temperature: 0.9,
        frequency_penalty: 0.1,
      };

      const result = mergeModelParams({
        defaults,
        projectParams,
        requestOverrides,
      });

      expect(result.standardParams.temperature).toBe(0.9); // request wins
      expect(result.standardParams.top_p).toBe(0.9); // from project
      expect(result.standardParams.max_tokens).toBe(1000); // from defaults
      expect(result.standardParams.frequency_penalty).toBe(0.1); // from request
      expect(result.providerOptions.custom_param).toBe("project_value"); // project wins over default
    });

    it("should handle nested object merging correctly", () => {
      const defaults: CustomLlmParams = {
        reasoning: {
          effort: "medium",
          style: "analytical",
        },
        other_config: {
          timeout: 30,
        },
      };

      const projectParams: CustomLlmParams = {
        reasoning: {
          effort: "high",
        },
      };

      const result = mergeModelParams({
        defaults,
        projectParams,
      });

      expect(result.providerOptions.reasoning).toEqual({
        effort: "high", // overridden
        style: "analytical", // preserved
      });
      expect(result.providerOptions.other_config).toEqual({
        timeout: 30, // preserved
      });
    });

    it("should filter out reserved keys and log warnings", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const params: CustomLlmParams = {
        temperature: 0.8,
        model: "gpt-4", // reserved
        messages: [], // reserved
        custom_param: "value",
      };

      const result = mergeModelParams({
        requestOverrides: params,
      });

      expect(result.standardParams.temperature).toBe(0.8);
      expect(result.providerOptions.custom_param).toBe("value");
      expect(result.standardParams).not.toHaveProperty("model");
      expect(result.providerOptions).not.toHaveProperty("model");
      expect(result.providerOptions).not.toHaveProperty("messages");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Custom parameter 'model' is reserved and will be ignored",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Custom parameter 'messages' is reserved and will be ignored",
      );

      consoleSpy.mockRestore();
    });

    it("should separate standard params from provider options correctly", () => {
      const params: CustomLlmParams = {
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 1500,
        custom_provider_param: "value",
        another_custom: { nested: "object" },
      };

      const result = mergeModelParams({
        requestOverrides: params,
      });

      // Standard params should be extracted
      expect(result.standardParams).toEqual({
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 1500,
      });

      // Provider options should contain non-standard params
      expect(result.providerOptions).toEqual({
        custom_provider_param: "value",
        another_custom: { nested: "object" },
      });
    });

    it("should handle empty inputs gracefully", () => {
      const result = mergeModelParams({});

      expect(result.standardParams).toEqual({});
      expect(result.providerOptions).toEqual({});
    });

    it("should handle undefined and null values correctly", () => {
      const params: CustomLlmParams = {
        temperature: 0.8,
        undefined_param: undefined,
        null_param: null,
        valid_param: "value",
      };

      const result = mergeModelParams({
        requestOverrides: params,
      });

      expect(result.standardParams.temperature).toBe(0.8);
      expect(result.providerOptions.valid_param).toBe("value");
      // undefined and null should be preserved as they might be meaningful
      expect(result.providerOptions).toHaveProperty("undefined_param");
      expect(result.providerOptions).toHaveProperty("null_param");
    });
  });

  describe("validateCustomParams", () => {
    it("should validate parameters successfully when no reserved keys are used", () => {
      const params: CustomLlmParams = {
        temperature: 0.8,
        custom_param: "value",
        provider_specific: { config: "value" },
      };

      const result = validateCustomParams(params);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should return errors when reserved keys are used", () => {
      const params: CustomLlmParams = {
        temperature: 0.8,
        model: "gpt-4", // reserved
        messages: [], // reserved
        tools: [], // reserved
        custom_param: "value",
      };

      const result = validateCustomParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Parameter 'model' is reserved and cannot be customized",
      );
      expect(result.errors).toContain(
        "Parameter 'messages' is reserved and cannot be customized",
      );
      expect(result.errors).toContain(
        "Parameter 'tools' is reserved and cannot be customized",
      );
      expect(result.errors).toHaveLength(3);
    });

    it("should handle empty parameters", () => {
      const result = validateCustomParams({});

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("Constants", () => {
    it("should have correct reserved parameter keys", () => {
      const expectedReservedKeys = [
        "model",
        "messages",
        "tools",
        "tool_choice",
        "stream",
        "response_format",
        "user",
        "logit_bias",
        "logprobs",
        "top_logprobs",
        "n",
        "stop",
        "suffix",
        "echo",
        "best_of",
        "completion_config",
        "prompt",
        "max_completion_tokens",
      ];

      expectedReservedKeys.forEach((key) => {
        expect(RESERVED_PARAM_KEYS.has(key)).toBe(true);
      });
    });

    it("should have correct standard parameter keys", () => {
      const expectedStandardKeys = [
        "temperature",
        "top_p",
        "max_tokens",
        "frequency_penalty",
        "presence_penalty",
        "top_k",
        "repetition_penalty",
        "min_p",
        "seed",
      ];

      expectedStandardKeys.forEach((key) => {
        expect(STANDARD_PARAM_KEYS.has(key)).toBe(true);
      });
    });

    it("should not have overlap between reserved and standard keys", () => {
      const overlap = [...RESERVED_PARAM_KEYS].filter((key) =>
        STANDARD_PARAM_KEYS.has(key),
      );

      expect(overlap).toEqual([]);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle a realistic OpenAI-compatible provider scenario", () => {
      const defaults: CustomLlmParams = {
        temperature: 0.7,
        max_tokens: 2000,
      };

      const projectParams: CustomLlmParams = {
        temperature: 0.8,
        top_p: 0.9,
        // OpenAI-compatible provider specific
        response_format: { type: "json_object" }, // This should be filtered as reserved
        custom_headers: { "X-Custom": "value" },
      };

      const requestOverrides: CustomLlmParams = {
        max_tokens: 1500,
        seed: 42,
      };

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = mergeModelParams({
        defaults,
        projectParams,
        requestOverrides,
      });

      // Standard params should be correctly extracted
      expect(result.standardParams).toEqual({
        temperature: 0.8, // from project
        max_tokens: 1500, // from request (highest precedence)
        top_p: 0.9, // from project
        seed: 42, // from request
      });

      // Provider options should contain non-standard, non-reserved params
      expect(result.providerOptions).toEqual({
        custom_headers: { "X-Custom": "value" },
      });

      // Should warn about reserved key
      expect(consoleSpy).toHaveBeenCalledWith(
        "Custom parameter 'response_format' is reserved and will be ignored",
      );

      consoleSpy.mockRestore();
    });

    it("should handle complex nested reasoning parameters", () => {
      const projectParams: CustomLlmParams = {
        reasoning: {
          effort: "high",
          style: "step_by_step",
          max_reasoning_tokens: 10000,
        },
        temperature: 0.8,
      };

      const requestOverrides: CustomLlmParams = {
        reasoning: {
          effort: "medium", // Override just this field
        },
        top_p: 0.95,
      };

      const result = mergeModelParams({
        projectParams,
        requestOverrides,
      });

      expect(result.standardParams).toEqual({
        temperature: 0.8,
        top_p: 0.95,
      });

      expect(result.providerOptions.reasoning).toEqual({
        effort: "medium", // overridden
        style: "step_by_step", // preserved
        max_reasoning_tokens: 10000, // preserved
      });
    });
  });
});
