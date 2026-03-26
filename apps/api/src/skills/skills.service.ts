import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  decryptProviderKey,
  type ExternalSkillMetadata,
  type ProviderSkillReference,
} from "@tambo-ai-cloud/core";
import { type HydraDatabase, operations, schema } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/database-provider";

/** Providers that support the skills API. */
const SKILL_PROVIDERS = new Set(["openai", "anthropic"]);

/**
 * Service for uploading skills to provider APIs (OpenAI, Anthropic)
 * and persisting returned metadata in `externalSkillMetadata`.
 */
@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Check if a provider supports the skills API.
   * @returns Whether the provider has a skills upload endpoint.
   */
  supportsSkills(providerName: string): boolean {
    return SKILL_PROVIDERS.has(providerName);
  }

  /**
   * Upload a skill to the provider API and return the metadata to store.
   * Formats the skill as a SKILL.md file bundle and POSTs to the provider.
   * @returns The provider-specific metadata (skillId, uploadedAt, version).
   */
  async uploadToProvider({
    skill,
    providerName,
    apiKey,
  }: {
    skill: schema.DBSkill;
    providerName: string;
    apiKey: string;
  }): Promise<ProviderSkillReference> {
    const skillMdContent = this.formatSkillMd(skill);

    if (providerName === "openai") {
      return await this.uploadToOpenAI(skill, skillMdContent, apiKey);
    }

    if (providerName === "anthropic") {
      return await this.uploadToAnthropic(skill, skillMdContent, apiKey);
    }

    throw new Error(`Provider ${providerName} does not support skills`);
  }

  /**
   * Ensure a skill has been uploaded to the given provider.
   * If externalSkillMetadata already has metadata for this provider, skip.
   * Otherwise upload and persist the returned metadata.
   * @returns The provider skill reference.
   */
  async ensureSkillUploaded({
    skill,
    providerName,
    apiKey,
  }: {
    skill: schema.DBSkill;
    providerName: string;
    apiKey: string;
  }): Promise<ProviderSkillReference> {
    const existing = skill.externalSkillMetadata?.[providerName];

    if (existing) {
      return existing;
    }

    const metadata = await this.uploadToProvider({
      skill,
      providerName,
      apiKey,
    });

    const updatedExternalMetadata: ExternalSkillMetadata = {
      ...skill.externalSkillMetadata,
      [providerName]: metadata,
    };

    await operations.updateSkill(this.db, {
      projectId: skill.projectId,
      skillId: skill.id,
      externalSkillMetadata: updatedExternalMetadata,
    });

    return metadata;
  }

  /**
   * Delete a skill from the provider API.
   * Best-effort: log warning on failure, don't block DB deletion.
   */
  async deleteFromProvider({
    skill,
    providerName,
    apiKey,
  }: {
    skill: schema.DBSkill;
    providerName: string;
    apiKey: string;
  }): Promise<void> {
    const existing = skill.externalSkillMetadata?.[providerName];

    if (!existing) {
      return;
    }

    try {
      if (providerName === "openai") {
        await this.deleteFromOpenAI(existing.skillId, apiKey);
      } else if (providerName === "anthropic") {
        await this.deleteFromAnthropic(existing.skillId, apiKey);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to delete skill ${skill.id} from ${providerName}: ${error}`,
      );
    }
  }

  /**
   * Get the decrypted provider API key for a project.
   * @returns The decrypted API key, or undefined if not available.
   */
  async getProviderApiKey(
    projectId: string,
    providerName: string,
  ): Promise<string | undefined> {
    try {
      const providerKeys = await operations.getProviderKeys(this.db, projectId);

      const providerKey = providerKeys.find(
        (k) => k.providerName === providerName,
      );
      if (!providerKey?.providerKeyEncrypted) return undefined;

      const secret = this.configService.get<string>("PROVIDER_KEY_SECRET");
      if (!secret) return undefined;

      const { providerKey: decryptedKey } = decryptProviderKey(
        providerKey.providerKeyEncrypted,
        secret,
      );
      return decryptedKey;
    } catch (error) {
      this.logger.warn(
        `Failed to get provider key for ${providerName} in project ${projectId}: ${error}`,
      );
      return undefined;
    }
  }

  /**
   * Format a skill as SKILL.md content for upload.
   * @returns The formatted SKILL.md string.
   */
  private formatSkillMd(skill: schema.DBSkill): string {
    const quotedDescription = skill.description.replace(/"/g, '\\"');
    return [
      "---",
      `name: ${skill.name}`,
      `description: "${quotedDescription}"`,
      "---",
      "",
      skill.instructions,
    ].join("\n");
  }

  /**
   * Upload a skill to OpenAI's skills API.
   * POST /v1/skills with multipart form data.
   * @returns The provider skill reference with skillId and version.
   */
  private async uploadToOpenAI(
    skill: schema.DBSkill,
    skillMdContent: string,
    apiKey: string,
  ): Promise<ProviderSkillReference> {
    const formData = new FormData();
    const blob = new Blob([skillMdContent], { type: "text/markdown" });
    formData.append("files[]", blob, "SKILL.md");
    formData.append("name", skill.name);

    const response = await fetch("https://api.openai.com/v1/skills", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI skill upload failed (${response.status}): ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      id: string;
      latest_version: string;
    };

    return {
      skillId: data.id,
      uploadedAt: new Date().toISOString(),
      version: data.latest_version,
    };
  }

  /**
   * Upload a skill to Anthropic's skills API.
   * POST /v1/skills with multipart form data and beta header.
   * @returns The provider skill reference with skillId and version.
   */
  private async uploadToAnthropic(
    skill: schema.DBSkill,
    skillMdContent: string,
    apiKey: string,
  ): Promise<ProviderSkillReference> {
    const formData = new FormData();
    const blob = new Blob([skillMdContent], { type: "text/markdown" });
    formData.append("files[]", blob, "SKILL.md");
    formData.append("display_title", skill.name);

    const response = await fetch("https://api.anthropic.com/v1/skills", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-beta": "skills-2025-10-02",
        "anthropic-version": "2023-06-01",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Anthropic skill upload failed (${response.status}): ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      id: string;
      latest_version: string;
    };

    return {
      skillId: data.id,
      uploadedAt: new Date().toISOString(),
      version: data.latest_version,
    };
  }

  /**
   * Delete a skill from OpenAI's API.
   */
  private async deleteFromOpenAI(
    skillId: string,
    apiKey: string,
  ): Promise<void> {
    const response = await fetch(
      `https://api.openai.com/v1/skills/${skillId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI skill delete failed (${response.status}): ${errorText}`,
      );
    }
  }

  /**
   * Delete a skill from Anthropic's API.
   */
  private async deleteFromAnthropic(
    skillId: string,
    apiKey: string,
  ): Promise<void> {
    const response = await fetch(
      `https://api.anthropic.com/v1/skills/${skillId}`,
      {
        method: "DELETE",
        headers: {
          "x-api-key": apiKey,
          "anthropic-beta": "skills-2025-10-02",
          "anthropic-version": "2023-06-01",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Anthropic skill delete failed (${response.status}): ${errorText}`,
      );
    }
  }
}
