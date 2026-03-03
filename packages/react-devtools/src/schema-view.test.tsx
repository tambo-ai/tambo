import { render, waitFor } from "@testing-library/react";
import React from "react";
import { SchemaView } from "./schema-view";

vi.mock("shiki", () => ({
  codeToHtml: vi.fn(
    (code: string) =>
      `<pre class="shiki"><code>${code.replace(/</g, "&lt;")}</code></pre>`,
  ),
}));

describe("SchemaView", () => {
  it("renders TypeScript-like schema with syntax highlighting", async () => {
    const schema = {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    };

    const { container } = render(<SchemaView schema={schema} style={{}} />);

    await waitFor(() => {
      expect(container.querySelector(".shiki")).toBeInTheDocument();
    });

    expect(container.textContent).toContain("name: string;");
  });

  it("returns null when schema is falsy", () => {
    const { container } = render(<SchemaView schema={null} style={{}} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders enum values as union", async () => {
    const schema = { enum: ["a", "b"] };

    const { container } = render(<SchemaView schema={schema} style={{}} />);

    await waitFor(() => {
      expect(container.querySelector(".shiki")).toBeInTheDocument();
    });

    expect(container.textContent).toContain('"a" | "b"');
  });

  it("renders array types", async () => {
    const schema = { type: "array", items: { type: "number" } };

    const { container } = render(<SchemaView schema={schema} style={{}} />);

    await waitFor(() => {
      expect(container.querySelector(".shiki")).toBeInTheDocument();
    });

    expect(container.textContent).toContain("number[]");
  });

  it("handles non-object schema gracefully", async () => {
    const { container } = render(
      <SchemaView schema="not-a-schema" style={{}} />,
    );

    await waitFor(() => {
      expect(container.querySelector(".shiki")).toBeInTheDocument();
    });

    expect(container.textContent).toContain("not-a-schema");
  });

  it("renders nested objects with proper indentation", async () => {
    const schema = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          required: ["name"],
        },
      },
      required: ["user"],
    };

    const { container } = render(<SchemaView schema={schema} style={{}} />);

    await waitFor(() => {
      expect(container.querySelector(".shiki")).toBeInTheDocument();
    });

    expect(container.textContent).toContain("user: {");
    expect(container.textContent).toContain("name: string;");
  });
});
