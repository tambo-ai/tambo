const NEUTRAL_BACKGROUNDS = new Set(["bg-muted", "bg-background", "bg-card"]);

const getLiteralValue = (valueNode) => {
  if (!valueNode) return null;

  if (valueNode.type === "Literal" && typeof valueNode.value === "string") {
    const raw = typeof valueNode.raw === "string" ? valueNode.raw : null;
    const quote = raw?.startsWith("'") ? "'" : '"';
    return {
      value: valueNode.value,
      quote,
    };
  }

  if (
    valueNode.type === "JSXExpressionContainer" &&
    valueNode.expression.type === "Literal" &&
    typeof valueNode.expression.value === "string"
  ) {
    const raw =
      typeof valueNode.expression.raw === "string"
        ? valueNode.expression.raw
        : null;
    const quote = raw?.startsWith("'") ? "'" : '"';
    return {
      value: valueNode.expression.value,
      quote,
    };
  }

  return null;
};

const replaceWithQuote = (fixer, node, newValue, quote) => {
  if (!node) return null;

  if (node.type === "Literal") {
    const q = quote ?? (node.raw?.startsWith("'") ? "'" : '"');
    return fixer.replaceText(node, `${q}${newValue}${q}`);
  }

  if (
    node.type === "JSXExpressionContainer" &&
    node.expression.type === "Literal"
  ) {
    const q = quote ?? (node.expression.raw?.startsWith("'") ? "'" : '"');
    return fixer.replaceText(node, `{${q}${newValue}${q}}`);
  }

  return null;
};

const hasNeutralBackground = (classes) =>
  classes.some((cls) => NEUTRAL_BACKGROUNDS.has(cls));

/**
 * ESLint rule to enforce correct design token usage
 * Catches text-primary/text-secondary misuse in components
 */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce correct design token usage",
      recommended: true,
    },
    messages: {
      textPrimaryWithoutBgPrimary:
        "text-primary should only be used with bg-primary. Use text-foreground for content text.",
      textSecondaryDeprecated:
        "text-secondary is deprecated. Use text-muted-foreground for labels/captions.",
      textPrimaryInPlaceholder:
        "Placeholders should use text-muted-foreground, not text-primary.",
      textPrimaryOnNeutralBg:
        "text-primary on bg-muted/bg-background is incorrect. Use text-foreground or text-muted-foreground.",
    },
    fixable: "code",
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (
          node.name.type !== "JSXIdentifier" ||
          node.name.name !== "className"
        ) {
          return;
        }

        const literal = getLiteralValue(node.value);
        if (!literal) return;

        const { value, quote } = literal;
        if (!value.trim()) return;

        const classes = value.split(/\s+/).filter(Boolean);
        const hasTextPrimary = classes.includes("text-primary");
        const hasBgPrimary = classes.includes("bg-primary");
        const hasTextSecondary = classes.includes("text-secondary");
        const hasPlaceholderTextPrimary = value.includes(
          "placeholder:text-primary",
        );

        if (hasTextSecondary) {
          context.report({
            node,
            messageId: "textSecondaryDeprecated",
            fix(fixer) {
              const newValue = value.replaceAll(
                "text-secondary",
                "text-muted-foreground",
              );
              return replaceWithQuote(fixer, node.value, newValue, quote);
            },
          });
        }

        if (hasPlaceholderTextPrimary) {
          context.report({
            node,
            messageId: "textPrimaryInPlaceholder",
            fix(fixer) {
              const newValue = value.replaceAll(
                "placeholder:text-primary",
                "placeholder:text-muted-foreground",
              );
              return replaceWithQuote(fixer, node.value, newValue, quote);
            },
          });
        }

        if (hasTextPrimary && !hasBgPrimary) {
          const messageId = hasNeutralBackground(classes)
            ? "textPrimaryOnNeutralBg"
            : "textPrimaryWithoutBgPrimary";

          context.report({
            node,
            messageId,
          });
        }
      },
    };
  },
};

export default rule;
