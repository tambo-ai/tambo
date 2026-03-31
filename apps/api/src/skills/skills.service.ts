import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  type ExternalSkillMetadata,
  type ProviderSkillConfig,
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
   * Fetch enabled skills for a project, ensure they're uploaded to the provider,
   * and return the config to pass to the LLM. Also increments usage counts
   * (fire-and-forget).
   * @returns The provider skill config, or undefined if no skills to inject.
   */
  async getProviderSkillsForRun({
    projectId,
    providerName,
    apiKey,
  }: {
    projectId: string;
    providerName: string;
    apiKey: string;
  }): Promise<ProviderSkillConfig | undefined> {
    if (!this.supportsSkills(providerName)) return undefined;

    const enabledSkills = await operations.listSkillsForProject(
      this.db,
      projectId,
      { enabledOnly: true },
    );
    if (enabledSkills.length === 0) return undefined;

    const skillRefs = await Promise.all(
      enabledSkills.map(async (skill) => {
        const ref = await this.ensureSkillUploaded({
          skill,
          providerName,
          apiKey,
        });
        return { skillId: ref.skillId, version: ref.version };
      }),
    );

    if (skillRefs.length === 0) return undefined;

    this.logger.log(
      `Skills injected: ${skillRefs.length} skills for provider ${providerName}`,
    );

    // Increment usage counts (fire-and-forget, don't block the run)
    void Promise.all(
      enabledSkills.map(async (skill) =>
        await operations
          .incrementSkillUsageCount(this.db, projectId, skill.id)
          .catch((error) =>
            this.logger.warn(
              `Failed to increment usage count for skill ${skill.id}: ${error}`,
            ),
          ),
      ),
    );

    return { providerName, skills: skillRefs };
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
