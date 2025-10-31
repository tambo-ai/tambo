import test from "node:test";
import assert from "node:assert/strict";
import { ESLint } from "eslint";
import tokenUsageRule from "../rules/token-usage.js";

const createESLint = () =>
  new ESLint({
    useEslintrc: false,
    overrideConfigFile: false,
    fix: true,
    plugins: {
      "@tambo": {
        rules: {
          "token-usage": tokenUsageRule,
        },
      },
    },
    baseConfig: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        "@tambo/token-usage": "error",
      },
    },
  });

test("token-usage allows neutral text tokens", async () => {
  const eslint = createESLint();
  const [result] = await eslint.lintText(
    '<p className="text-foreground">Body</p>',
    { filePath: "Component.tsx" },
  );

  assert.equal(result.messages.length, 0);
});

test("token-usage fixes deprecated text-secondary", async () => {
  const eslint = createESLint();
  const [result] = await eslint.lintText(
    '<p className="text-secondary">Caption</p>',
    { filePath: "Component.tsx" },
  );

  assert.equal(result.messages[0]?.messageId, "textSecondaryDeprecated");
  assert.equal(result.output, '<p className="text-muted-foreground">Caption</p>');
});

test("token-usage flags text-primary without bg-primary", async () => {
  const eslint = createESLint();
  const [result] = await eslint.lintText(
    '<label className="text-primary">Email</label>',
    { filePath: "Component.tsx" },
  );

  assert.equal(result.messages[0]?.messageId, "textPrimaryWithoutBgPrimary");
});

test("token-usage flags text-primary on neutral background", async () => {
  const eslint = createESLint();
  const [result] = await eslint.lintText(
    '<button className="bg-muted text-primary">Action</button>',
    { filePath: "Component.tsx" },
  );

  assert.equal(result.messages[0]?.messageId, "textPrimaryOnNeutralBg");
});

test("token-usage fixes placeholder text-primary", async () => {
  const eslint = createESLint();
  const [result] = await eslint.lintText(
    '<input className="placeholder:text-primary" />',
    { filePath: "Component.tsx" },
  );

  assert.equal(result.messages[0]?.messageId, "textPrimaryInPlaceholder");
  assert.equal(result.output, '<input className="placeholder:text-muted-foreground" />');
});
