/* eslint-env node */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_DIR = path.resolve(__dirname, "../src/app");

async function main() {
  const tsxFiles = await collectTsxFiles(APP_DIR);
  let filesUpdated = 0;
  let snippetsFormatted = 0;

  for (const filePath of tsxFiles) {
    const source = await fs.readFile(filePath, "utf8");
    const resolvedConfig = await prettier.resolveConfig(filePath);
    const prettierOptions = {
      ...(resolvedConfig ?? {}),
      parser: "typescript",
    };

    const matches = Array.from(source.matchAll(/code=\{\s*`([\s\S]*?)`\s*}/g));

    if (matches.length === 0) {
      continue;
    }

    let changed = false;
    let cursor = 0;
    let updated = "";

    for (const match of matches) {
      const [fullMatch, snippet] = match;
      const start = match.index ?? 0;
      const end = start + fullMatch.length;

      updated += source.slice(cursor, start);
      cursor = end;

      if (!snippet.trim() || snippet.includes("${")) {
        updated += fullMatch;
        continue;
      }

      const normalizedOriginal = normalize(snippet);
      const formattedSnippet = await prettier.format(snippet, prettierOptions);
      const normalizedFormatted = normalize(formattedSnippet);

      if (normalizedOriginal === normalizedFormatted) {
        updated += fullMatch;
        continue;
      }

      changed = true;
      snippetsFormatted += 1;
      updated += fullMatch.replace(snippet, normalizedFormatted);
    }

    updated += source.slice(cursor);

    if (changed) {
      await fs.writeFile(filePath, updated, "utf8");
      filesUpdated += 1;
      globalThis.console?.log?.(
        `Formatted code snippets in ${path.relative(
          path.resolve(__dirname, ".."),
          filePath,
        )}`,
      );
    }
  }

  if (snippetsFormatted === 0) {
    globalThis.console?.log?.("No code snippets required formatting.");
    return;
  }

  globalThis.console?.log?.(
    `Formatted ${snippetsFormatted} snippet${
      snippetsFormatted === 1 ? "" : "s"
    } across ${filesUpdated} file${filesUpdated === 1 ? "" : "s"}.`,
  );
}

main().catch((error) => {
  globalThis.console?.error?.("Failed to format code snippets.");
  globalThis.console?.error?.(error);
  if (globalThis.process) {
    globalThis.process.exitCode = 1;
  }
});

async function collectTsxFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTsxFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(entryPath);
    }
  }

  return files;
}

function normalize(value) {
  return value.replace(/\r\n/g, "\n").trimEnd();
}
