#!/usr/bin/env node

/**
 * Tambo AI Setup Script
 *
 * This script helps you set up your Tambo AI starter template.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const envPath = path.join(__dirname, "..", ".env");
const envExamplePath = path.join(__dirname, "..", ".env.example");

console.log("\n🚀 Welcome to Tambo AI Expo Starter Setup!\n");

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setup() {
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question(
      ".env file already exists. Overwrite? (y/N): ",
    );
    if (overwrite.toLowerCase() !== "y") {
      console.log(
        "\n✅ Setup cancelled. Your existing .env file was not modified.\n",
      );
      rl.close();
      return;
    }
  }

  console.log("\nTo get started with Tambo AI, you need an API key.");
  console.log("Get your API key from: https://tambo.ai/dashboard\n");

  const apiKey = await question(
    "Enter your Tambo AI API key (or press Enter to skip): ",
  );

  // Create .env file
  const envContent = `# Tambo AI Configuration
# Get your API key from: https://tambo.ai/dashboard

EXPO_PUBLIC_TAMBO_API_KEY=${apiKey || "your-api-key-here"}
`;

  fs.writeFileSync(envPath, envContent);

  console.log("\n✅ Setup complete!\n");

  if (!apiKey) {
    console.log(
      "⚠️  Remember to add your API key to .env before running the app.\n",
    );
  }

  console.log("Next steps:");
  console.log("  1. Run: npm start");
  console.log("  2. Open the app on your device/emulator");
  console.log('  3. Navigate to the "Tambo AI" tab');
  console.log("  4. Start chatting!\n");
  console.log("For more info, check TAMBO_README.md\n");

  rl.close();
}

setup().catch((error) => {
  console.error("Error during setup:", error);
  rl.close();
  process.exit(1);
});
