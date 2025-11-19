#!/usr/bin/env node

/**
 * Backfill script to populate serverKey for existing tool_providers that don't have one.
 *
 * This script:
 * 1. Finds all tool_providers with empty serverKey values
 * 2. Derives a serverKey from the URL using deriveServerKey()
 * 3. Updates the database with the derived serverKey
 * 4. Reports on what was updated
 *
 * Usage:
 *   npx ts-node scripts/backfill-server-keys.ts
 */

import { deriveServerKey, isValidServerKey } from "@tambo-ai-cloud/core";
import { getDb, schema } from "@tambo-ai-cloud/db";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const db = getDb(dbUrl);
  console.log("📦 Backfilling serverKey for existing MCP servers...\n");

  // Get all tool_providers with empty serverKey
  const serversNeedingKeys = await db
    .select()
    .from(schema.toolProviders)
    .where(eq(schema.toolProviders.serverKey, ""));

  if (serversNeedingKeys.length === 0) {
    console.log("✅ No servers need serverKey backfill - all set!");
    return;
  }

  console.log(
    `Found ${serversNeedingKeys.length} server(s) that need serverKey...\n`,
  );

  // Build a map of existing (non-empty) keys per project so we can ensure uniqueness
  const projectIds = Array.from(
    new Set(serversNeedingKeys.map((s) => s.projectId)),
  );

  const existingForProjects = projectIds.length
    ? await db
        .select({
          projectId: schema.toolProviders.projectId,
          serverKey: schema.toolProviders.serverKey,
        })
        .from(schema.toolProviders)
        .where(inArray(schema.toolProviders.projectId, projectIds))
    : ([] as Array<{ projectId: string; serverKey: string }>);

  const takenByProject = new Map<string, Set<string>>();
  for (const row of existingForProjects) {
    if (!row.serverKey) continue;
    const set = takenByProject.get(row.projectId) ?? new Set<string>();
    set.add(row.serverKey);
    takenByProject.set(row.projectId, set);
  }

  let updated = 0;
  let failed = 0;

  for (const server of serversNeedingKeys) {
    try {
      if (!server.url) {
        console.log(`⚠️  Skipping server ${server.id}: no URL configured`);
        failed++;
        continue;
      }

      let baseKey = deriveServerKey(server.url);
      // Sanitize to match API rules (alphanumeric + underscore); keep lowercase from deriveServerKey
      if (!isValidServerKey(baseKey)) {
        baseKey = baseKey.replace(/[^A-Za-z0-9_]/g, "_");
      }

      // Ensure the key is at least 2 characters
      if (baseKey.length < 2) {
        console.log(
          `⚠️  Skipping server ${server.id}: derived key "${baseKey}" is too short (min 2 chars)`,
        );
        failed++;
        continue;
      }

      // Ensure uniqueness within the project by appending a numeric suffix only when needed.
      const taken = takenByProject.get(server.projectId) ?? new Set<string>();
      let uniqueKey = baseKey;
      if (taken.has(uniqueKey)) {
        let suffix = 1;
        while (taken.has(`${baseKey}${suffix}`)) {
          suffix++;
        }
        uniqueKey = `${baseKey}${suffix}`;
      }

      // Update the server with the (possibly suffixed) key
      await db
        .update(schema.toolProviders)
        .set({ serverKey: uniqueKey })
        .where(eq(schema.toolProviders.id, server.id));

      // Track the new key to avoid collisions for subsequent servers in the same project
      taken.add(uniqueKey);
      takenByProject.set(server.projectId, taken);

      const suffixNote =
        uniqueKey === baseKey ? "" : ` (deduped → "${uniqueKey}")`;
      console.log(
        `✅ Server ${server.id}: URL "${server.url}" → serverKey "${baseKey}"${suffixNote}`,
      );
      updated++;
    } catch (error) {
      console.log(
        `❌ Server ${server.id}: Failed to update - ${error instanceof Error ? error.message : String(error)}`,
      );
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed:  ${failed}`);
  console.log(`   Total:   ${serversNeedingKeys.length}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
