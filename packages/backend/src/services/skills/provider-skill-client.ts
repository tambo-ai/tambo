import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/**
 * Delete a skill from the provider API (OpenAI or Anthropic).
 *
 * This is a standalone helper so both the NestJS service and the
 * tRPC route can share the same provider-deletion logic.
 *
 * @returns Nothing on success; throws on network/provider errors.
 */
export async function deleteSkillFromProvider({
  skillId,
  providerName,
  apiKey,
}: {
  skillId: string;
  providerName: string;
  apiKey: string;
}): Promise<void> {
  if (providerName === "openai") {
    const client = new OpenAI({ apiKey });
    await client.skills.delete(skillId);
  } else if (providerName === "anthropic") {
    const client = new Anthropic({ apiKey });
    await client.beta.skills.delete(skillId);
  } else {
    throw new Error(`Provider ${providerName} does not support skill deletion`);
  }
}
