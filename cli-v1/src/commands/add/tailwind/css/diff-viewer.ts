import chalk from "chalk";
import { diffLines } from "diff";

/**
 * Displays a colorized diff of CSS changes
 */
export function showCssDiff(
  originalContent: string,
  modifiedContent: string,
  filename = "globals.css",
): void {
  const diff = diffLines(originalContent, modifiedContent);

  // Don't show diff if there are no changes
  if (diff.length === 1 && !diff[0].added && !diff[0].removed) {
    console.log(`${chalk.blue("ℹ")} No changes needed for ${filename}`);
    return;
  }

  console.log(
    `\n${chalk.bold.blue("Preview of changes to")} ${chalk.bold(filename)}:`,
  );
  console.log(chalk.gray("─".repeat(60)));

  let addedLines = 0;
  let removedLines = 0;

  diff.forEach((part) => {
    // Split into lines for better formatting
    const lines = part.value.split("\n");

    lines.forEach((line, index) => {
      // Skip empty last line from split
      if (index === lines.length - 1 && line === "") return;

      if (part.added) {
        console.log(chalk.green(`+ ${line}`));
        addedLines++;
      } else if (part.removed) {
        console.log(chalk.red(`- ${line}`));
        removedLines++;
      } else {
        // Show some context lines, but limit them
        if (line.trim() !== "") {
          console.log(chalk.gray(`  ${line}`));
        }
      }
    });
  });

  console.log(chalk.gray("─".repeat(60)));
  console.log(
    `${chalk.green(`+${addedLines} additions`)} ${chalk.red(`-${removedLines} deletions`)}`,
  );
}

/**
 * Shows a compact summary of what will be added
 */
export function showChangesSummary(
  originalContent: string,
  modifiedContent: string,
  isV4: boolean,
): void {
  const diff = diffLines(originalContent, modifiedContent);
  const addedContent = diff
    .filter((part) => part.added)
    .map((part) => part.value)
    .join("");

  if (!addedContent.trim()) {
    console.log(
      `${chalk.green("✔")} No changes needed - all required CSS is already present`,
    );
    return;
  }

  console.log(`\n${chalk.bold.blue("Summary of changes:")}`);

  // Count what's being added
  const additions = {
    variables: (addedContent.match(/--[\w-]+:/g) ?? []).length,
    customVariants: (addedContent.match(/@custom-variant/g) ?? []).length,
    themeBlocks: (addedContent.match(/@theme/g) ?? []).length,
    utilities: (addedContent.match(/@layer utilities/g) ?? []).length,
    layers: (addedContent.match(/@layer base/g) ?? []).length,
  };

  if (additions.variables > 0) {
    console.log(`  ${chalk.green("+")} ${additions.variables} CSS variables`);
  }

  if (isV4) {
    if (additions.customVariants > 0) {
      console.log(
        `  ${chalk.green("+")} ${additions.customVariants} custom variants`,
      );
    }
    if (additions.themeBlocks > 0) {
      console.log(
        `  ${chalk.green("+")} ${additions.themeBlocks} theme blocks`,
      );
    }
  } else {
    if (additions.layers > 0) {
      console.log(`  ${chalk.green("+")} ${additions.layers} layer blocks`);
    }
    if (additions.utilities > 0) {
      console.log(
        `  ${chalk.green("+")} ${additions.utilities} utility layers`,
      );
    }
  }
}
