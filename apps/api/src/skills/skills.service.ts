import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  type ExternalSkillMetadata,
  type ProviderSkillReference,
} from "@tambo-ai-cloud/core";
import { type HydraDatabase, operations, schema } from "@tambo-ai-cloud/db";
import {
  deleteSkillFromProvider,
  uploadSkillToProvider,
  providerSupportsSkills,
} from "@tambo-ai-cloud/backend";
import { DATABASE } from "../common/database-provider";

/**
 * Service for managing skills on provider APIs (OpenAI, Anthropic).
 * Delegates to shared helpers in @tambo-ai-cloud/backend for the actual
 * provider API calls.
 */
@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
  ) {}

  /**
   * Check if a provider supports the skills API.
   * @returns Whether the provider has a skills upload endpoint.
   */
  supportsSkills(providerName: string): boolean {
    return providerSupportsSkills(providerName);
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
    return await uploadSkillToProvider({ skill, providerName, apiKey });
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
}
