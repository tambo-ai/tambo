export function TokenUsageNote() {
  return (
    <p className="text-sm text-muted-foreground mt-2 mb-6">
      Token usage: default to neutral tokens like <code>text-foreground</code>
      {" "}
      and <code>text-muted-foreground</code>. Reserve <code>text-primary</code>
      {" "}
      for elements on <code>bg-primary</code>, and keep placeholders neutral with
      {" "}
      <code>placeholder:text-muted-foreground</code>. Refer to <code>TOKENS.md</code>
      {" "}
      for the full rules.
    </p>
  );
}
