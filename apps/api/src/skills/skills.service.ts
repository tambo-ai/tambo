import { Inject, Injectable, Logger } from "@nestjs/common";
import {
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

    const metadata = await uploadSkillToProvider({
      skill,
      providerName,
      apiKey,
    });

    // Atomic merge to avoid read-spread-write race conditions
    await operations.mergeSkillMetadata(this.db, skill.projectId, skill.id, {
      [providerName]: metadata,
    });

    return metadata;
  }

  /**
   * Fetch enabled skills for a project, ensure they're uploaded to the provider,
   * and return the config to pass to the LLM.
   * @returns The provider skill config, or undefined if no skills to inject.
   */
  async ensureProviderSkillsForRun({
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

    // Only include skills that already have provider metadata. Freshly uploaded
    // skills may not be available on the provider yet (eventual consistency),
    // so we upload them now (for next time) but skip them for this run.
    const skillRefs: Array<{ skillId: string; version: string }> = [];
    await Promise.all(
      enabledSkills.map(async (skill) => {
        const existingRef = skill.externalSkillMetadata?.[providerName];
        if (existingRef) {
          skillRefs.push({
            skillId: existingRef.skillId,
            version: existingRef.version,
          });
        } else {
          // Upload for next run (fire-and-forget)
          void this.ensureSkillUploaded({ skill, providerName, apiKey }).catch(
            (error) =>
              this.logger.warn(
                `Background upload failed for skill ${skill.id}: ${error}`,
              ),
          );
        }
      }),
    );

    if (skillRefs.length === 0) return undefined;

    this.logger.log(
      `Skills injected: ${skillRefs.length} skills for provider ${providerName}`,
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
