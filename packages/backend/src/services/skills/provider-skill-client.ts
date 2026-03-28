import type { ProviderSkillReference } from "@tambo-ai-cloud/core";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/** Providers that support the skills API. */
const SKILL_PROVIDERS = new Set(["openai", "anthropic"]);

/**
 * Check if a provider supports the skills API.
 * @returns Whether the provider has a skills upload endpoint.
 */
export function providerSupportsSkills(providerName: string): boolean {
  return SKILL_PROVIDERS.has(providerName);
}

/**
 * Format a skill as SKILL.md content for upload to a provider.
 * @returns The formatted SKILL.md string with YAML frontmatter.
 */
export function formatSkillMd(skill: {
  name: string;
  description: string;
  instructions: string;
}): string {
  const escapedDescription = skill.description
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "")
    .replace(/\n/g, " ");
  return [
    "---",
    `name: ${skill.name}`,
    `description: "${escapedDescription}"`,
    "---",
    "",
    skill.instructions,
  ].join("\n");
}

/**
 * Upload a skill to the provider API (OpenAI or Anthropic).
 *
 * Shared helper so both the NestJS service and the tRPC route
 * can upload skills without duplicating provider-specific logic.
 *
 * @returns The provider-specific metadata (skillId, uploadedAt, version).
 */
export async function uploadSkillToProvider({
  skill,
  providerName,
  apiKey,
}: {
  skill: { name: string; description: string; instructions: string };
  providerName: string;
  apiKey: string;
}): Promise<ProviderSkillReference> {
  if (providerName === "openai") {
    return await uploadToOpenAI(skill, apiKey);
  }

  if (providerName === "anthropic") {
    return await uploadToAnthropic(skill, apiKey);
  }

  throw new Error(`Provider ${providerName} does not support skills`);
}

/**
 * Delete a skill from the provider API (OpenAI or Anthropic).
 *
 * Shared helper so both the NestJS service and the tRPC route
 * can share the same provider-deletion logic.
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

async function uploadToOpenAI(
  skill: { name: string; description: string; instructions: string },
  apiKey: string,
): Promise<ProviderSkillReference> {
  const content = formatSkillMd(skill);

  // OpenAI requires skill files under a top-level directory
  // (e.g. "my-skill/SKILL.md"). The Node SDK's getName() strips directory
  // paths from filenames, so we build the multipart form directly.
  const form = new FormData();
  form.append(
    "files",
    new Blob([content], { type: "text/markdown" }),
    `${skill.name}/SKILL.md`,
  );

  const response = await fetch("https://api.openai.com/v1/skills", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenAI skills upload failed (${response.status}): ${body}`,
    );
  }

  const result = (await response.json()) as Record<string, unknown>;

  return {
    skillId: result.id as string,
    uploadedAt: new Date().toISOString(),
    version: (result.latest_version as string) ?? "1",
  };
}

async function uploadToAnthropic(
  skill: { name: string; description: string; instructions: string },
  apiKey: string,
): Promise<ProviderSkillReference> {
  const client = new Anthropic({ apiKey });

  const content = formatSkillMd(skill);
  const file = new File([content], `${skill.name}/SKILL.md`, {
    type: "text/markdown",
  });

  const result = await client.beta.skills.create({
    display_title: skill.name,
    files: [file],
  });

  return {
    skillId: result.id,
    uploadedAt: new Date().toISOString(),
    version: result.latest_version ?? "1",
  };
}
