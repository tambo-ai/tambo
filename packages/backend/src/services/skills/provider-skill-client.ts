import {
  type ProviderSkillReference,
  SKILLS_SUPPORTED_PROVIDERS,
} from "@tambo-ai-cloud/core";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/**
 * Check if a provider supports the skills API.
 * @returns Whether the provider has a skills upload endpoint.
 */
export function providerSupportsSkills(providerName: string): boolean {
  return SKILLS_SUPPORTED_PROVIDERS.has(providerName);
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
    `name: "${skill.name}"`,
    `description: "${escapedDescription}"`,
    "---",
    "",
    skill.instructions,
  ].join("\n");
}

/**
 * Create a new skill on the provider API (OpenAI or Anthropic).
 *
 * Shared helper so both the NestJS service and the tRPC route
 * can create skills without duplicating provider-specific logic.
 *
 * @returns The provider-specific metadata (skillId, uploadedAt, version).
 */
export async function uploadSkillToProvider({
  skill,
  providerName,
  apiKey,
}: {
  skill: {
    name: string;
    description: string;
    instructions: string;
    projectId?: string;
  };
  providerName: string;
  apiKey: string;
}): Promise<ProviderSkillReference> {
  if (providerName === "openai") {
    return await uploadToOpenAI(skill, apiKey);
  }

  if (providerName === "anthropic") {
    return await createAnthropicSkill(skill, apiKey);
  }

  throw new Error(`Provider ${providerName} does not support skills`);
}

/**
 * Update an existing skill on the provider API by creating a new version.
 *
 * Requires the existing provider skill reference so the provider client
 * knows which remote skill to update. For Anthropic this deletes the old
 * skill and creates a fresh one. Ideally we'd use Anthropic's
 * `skills.versions.create()`, but the SDK strips directory paths from
 * filenames in multipart uploads, and `versions.create` requires
 * `SKILL.md` inside a top-level directory.
 * See: https://github.com/anthropics/anthropic-sdk-typescript/issues/968
 * Same issue exists in the OpenAI SDK:
 * See: https://github.com/openai/openai-node/issues/1807
 *
 * @returns The updated provider-specific metadata.
 */
export async function updateSkillOnProvider({
  skill,
  providerName,
  apiKey,
  existingRef,
}: {
  skill: {
    name: string;
    description: string;
    instructions: string;
    projectId?: string;
  };
  providerName: string;
  apiKey: string;
  existingRef: ProviderSkillReference;
}): Promise<ProviderSkillReference> {
  if (providerName === "openai") {
    const client = new OpenAI({ apiKey });
    await client.skills.delete(existingRef.skillId);
    return await uploadToOpenAI(skill, apiKey);
  }

  if (providerName === "anthropic") {
    return await updateAnthropicSkill(skill, apiKey, existingRef);
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
    await deleteAnthropicSkillWithVersions(client, skillId);
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
  // See: https://github.com/openai/openai-node/issues/1807
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

async function createAnthropicSkill(
  skill: {
    name: string;
    description: string;
    instructions: string;
    projectId?: string;
  },
  apiKey: string,
): Promise<ProviderSkillReference> {
  const client = new Anthropic({ apiKey });

  const content = formatSkillMd(skill);
  const file = new File([content], `${skill.name}/SKILL.md`, {
    type: "text/markdown",
  });

  // Anthropic scopes display_title by API key. If two projects share a key,
  // duplicate names collide. Prefix with projectId to avoid conflicts.
  const displayTitle = skill.projectId
    ? `${skill.projectId}/${skill.name}`
    : skill.name;

  try {
    const result = await client.beta.skills.create({
      display_title: displayTitle,
      files: [file],
    });

    return {
      skillId: result.id,
      uploadedAt: new Date().toISOString(),
      version: result.latest_version ?? "1",
    };
  } catch (error) {
    // An orphaned skill with this display_title may exist on Anthropic
    // (e.g. local metadata was lost). Delete it and retry the create.
    if (isDuplicateTitleError(error)) {
      const orphaned = await findAnthropicSkillByTitle(client, displayTitle);
      if (orphaned) {
        await deleteAnthropicSkillWithVersions(client, orphaned.id);
        const result = await client.beta.skills.create({
          display_title: displayTitle,
          files: [file],
        });
        return {
          skillId: result.id,
          uploadedAt: new Date().toISOString(),
          version: result.latest_version ?? "1",
        };
      }
    }
    throw error;
  }
}

function isDuplicateTitleError(error: unknown): boolean {
  return (
    error instanceof Anthropic.APIError &&
    error.status === 400 &&
    typeof error.message === "string" &&
    error.message.includes("reuse an existing display_title")
  );
}

/**
 * Find an Anthropic skill by its display_title.
 * @returns The matching skill, or undefined if not found.
 */
async function findAnthropicSkillByTitle(
  client: Anthropic,
  displayTitle: string,
): Promise<{ id: string } | undefined> {
  for await (const skill of client.beta.skills.list()) {
    if (skill.display_title === displayTitle) {
      return { id: skill.id };
    }
  }
  return undefined;
}

/**
 * Delete an Anthropic skill, removing all its versions first.
 * Anthropic requires all versions to be deleted before the skill itself.
 */
async function deleteAnthropicSkillWithVersions(
  client: Anthropic,
  skillId: string,
): Promise<void> {
  for await (const version of client.beta.skills.versions.list(skillId)) {
    await client.beta.skills.versions.delete(version.version, {
      skill_id: skillId,
    });
  }
  await client.beta.skills.delete(skillId);
}

async function updateAnthropicSkill(
  skill: {
    name: string;
    description: string;
    instructions: string;
    projectId?: string;
  },
  apiKey: string,
  existingRef: ProviderSkillReference,
): Promise<ProviderSkillReference> {
  // The Anthropic SDK strips directory paths from filenames, but
  // versions.create requires SKILL.md inside a top-level directory.
  // Rather than bypassing the SDK with raw fetch, delete the old skill
  // and create a fresh one with the updated content.
  const client = new Anthropic({ apiKey });
  await deleteAnthropicSkillWithVersions(client, existingRef.skillId);
  return await createAnthropicSkill(skill, apiKey);
}
