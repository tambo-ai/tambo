import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_DIR = path.resolve(__dirname, "../src/app");

void test("component code snippets stay Prettier formatted", async () => {
  const tsxFiles = await collectTsxFiles(APP_DIR);
  const failures = [];

  for (const filePath of tsxFiles) {
    const source = await fs.readFile(filePath, "utf8");
    const snippets = extractCodeSnippets(source);

    if (snippets.length === 0) {
      continue;
    }

    const prettierOptions = {
      ...(await prettier.resolveConfig(filePath)),
      parser: "typescript",
    };

    for (const { snippet, index } of snippets) {
      if (snippet.includes("${")) {
        continue;
      }

      const normalizedOriginal = normalize(snippet);
      const normalizedFormatted = normalize(
        await prettier.format(snippet, prettierOptions),
      );

      if (normalizedOriginal !== normalizedFormatted) {
        const relativePath = path.relative(
          path.resolve(__dirname, ".."),
          filePath,
        );
        failures.push(
          `${relativePath} (snippet starting at character ${index})`,
        );
      }
    }
  }

  if (failures.length > 0) {
    const details = failures.map((item) => `- ${item}`).join("\n");
    assert.fail(
      `Found ${failures.length} code snippet${
        failures.length > 1 ? "s" : ""
      } that are not Prettier formatted:\n${details}\n\n` +
        "Run `npm run format:code` to reformat snippet strings, then rerun this test.",
    );
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

function extractCodeSnippets(source) {
  const regex = /code=\{\s*`([\s\S]*?)`\s*}/g;
  const snippets = [];
  let match;

  while ((match = regex.exec(source)) !== null) {
    snippets.push({ snippet: match[1], index: match.index });
  }

  return snippets;
}

function normalize(value) {
  return value.replace(/\r\n/g, "\n").trimEnd();
}
