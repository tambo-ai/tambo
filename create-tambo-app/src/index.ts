#!/usr/bin/env node

import spawn from "cross-spawn";

// Use npx to ensure we get the latest version of tambo
const args = ["-y", "tambo@latest", "create-app", ...process.argv.slice(2)];
const child = spawn("npx", args, {
  stdio: "inherit",
});

// Handle the case where `npx` is not found on PATH. When not using a shell,
// Node will emit an `error` event with code `ENOENT` instead of giving us a
// regular non-zero exit code. Provide a clear message and exit with code 127
// (conventional "command not found").
child.on("error", (err: NodeJS.ErrnoException) => {
  if (err?.code === "ENOENT") {
    console.error(
      "create-tambo-app: `npx` was not found on your PATH. Install Node.js (which provides npx) or ensure `npx` is available, then retry.",
    );
    process.exit(127);
    return;
  }

  console.error(
    `create-tambo-app: failed to launch 'npx': ${err?.message ?? "unknown error"}`,
  );
  process.exit(1);
});

child.on("exit", (code: number | null) => {
  process.exit(code ?? 0);
});
