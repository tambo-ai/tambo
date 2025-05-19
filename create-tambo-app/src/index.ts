#!/usr/bin/env node

import { spawn } from "child_process";

// Use npx to ensure we get the latest version of tambo
const args = ["-y", "tambo", "create-app@latest", ...process.argv.slice(2)];
const child = spawn("npx", args, {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
