import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  decryptProviderKey,
  type ExternalSkillMetadata,
  type ProviderSkillReference,
} from "@tambo-ai-cloud/core";
import { type HydraDatabase, operations, schema } from "@tambo-ai-cloud/db";
import { deleteSkillFromProvider } from "@tambo-ai-cloud/backend";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { DATABASE } from "../common/database-provider";

/** Providers that support the skills API. */
const SKILL_PROVIDERS = new Set(["openai", "anthropic"]);

/**
 * Service for managing skills on provider APIs (OpenAI, Anthropic)
 * using their official SDKs.
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
    if (providerName === "openai") {
      return await this.uploadToOpenAI(skill, apiKey);
    }

    if (providerName === "anthropic") {
      return await this.uploadToAnthropic(skill, apiKey);
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
      await deleteSkillFromProvider({
        skillId: existing.skillId,
        providerName,
        apiKey,
      });
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
   * Upload a skill to OpenAI using the official SDK.
   * @returns The provider skill reference with skillId and version.
   */
  private async uploadToOpenAI(
    skill: schema.DBSkill,
    apiKey: string,
  ): Promise<ProviderSkillReference> {
    const client = new OpenAI({ apiKey });

    const skillMdContent = this.formatSkillMd(skill);
    const file = new File([skillMdContent], "SKILL.md", {
      type: "text/markdown",
    });

    const result = await client.skills.create({
      files: [file],
    });

    return {
      skillId: result.id,
      uploadedAt: new Date().toISOString(),
      version: result.latest_version ?? "1",
    };
  }

  /**
   * Upload a skill to Anthropic using the official SDK.
   * @returns The provider skill reference with skillId and version.
   */
  private async uploadToAnthropic(
    skill: schema.DBSkill,
    apiKey: string,
  ): Promise<ProviderSkillReference> {
    const client = new Anthropic({ apiKey });

    const skillMdContent = this.formatSkillMd(skill);
    const file = new File([skillMdContent], "SKILL.md", {
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

  /**
   * Format a skill as SKILL.md content for upload.
   * @returns The formatted SKILL.md string.
   */
  private formatSkillMd(skill: schema.DBSkill): string {
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
}
