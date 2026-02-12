import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectComponents } from "./component-detection.js";

describe("detectComponents", () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = mkdtempSync(join(tmpdir(), "component-detection-test-"));
  });

  afterEach(() => {
    // Clean up temporary directory
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect exported function component with props and hooks", () => {
    const componentsDir = join(tempDir, "components");
    mkdirSync(componentsDir);

    const componentPath = join(componentsDir, "Button.tsx");
    const componentContent = `
import { useState } from "react";

export interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button onClick={onClick} onMouseEnter={() => setIsHovered(true)}>
      {label}
    </button>
  );
}
`;
    writeFileSync(componentPath, componentContent, "utf-8");

    const result = detectComponents([componentsDir]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Button",
      filePath: componentPath,
      isExported: true,
      hasProps: true,
      propsInterface: "ButtonProps",
      hooks: ["useState"],
    });
  });

  it("should detect arrow function component with React.FC type", () => {
    const componentsDir = join(tempDir, "components");
    mkdirSync(componentsDir);

    const componentPath = join(componentsDir, "Card.tsx");
    const componentContent = `
import React from "react";

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
};
`;
    writeFileSync(componentPath, componentContent, "utf-8");

    const result = detectComponents([componentsDir]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Card",
      filePath: componentPath,
      isExported: true,
      hasProps: true,
      propsInterface: "CardProps",
      hooks: [],
    });
  });

  it("should filter out non-exported components", () => {
    const componentsDir = join(tempDir, "components");
    mkdirSync(componentsDir);

    const componentPath = join(componentsDir, "Internal.tsx");
    const componentContent = `
import React from "react";

// Internal helper component, not exported
function HelperComponent() {
  return <div>Helper</div>;
}

// Exported component
export function MainComponent() {
  return (
    <div>
      <HelperComponent />
    </div>
  );
}
`;
    writeFileSync(componentPath, componentContent, "utf-8");

    const result = detectComponents([componentsDir]);

    // Should only include the exported component
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("MainComponent");
    expect(result[0].isExported).toBe(true);
  });

  it("should skip test files", () => {
    const componentsDir = join(tempDir, "components");
    mkdirSync(componentsDir);

    const testPath = join(componentsDir, "Button.test.tsx");
    const testContent = `
import { render } from "@testing-library/react";

function TestButton() {
  return <button>Test</button>;
}

describe("Button", () => {
  it("renders", () => {
    render(<TestButton />);
  });
});
`;
    writeFileSync(testPath, testContent, "utf-8");

    const componentPath = join(componentsDir, "Button.tsx");
    const componentContent = `
export function Button() {
  return <button>Real Button</button>;
}
`;
    writeFileSync(componentPath, componentContent, "utf-8");

    const result = detectComponents([componentsDir]);

    // Should only include the real component, not the test
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Button");
    expect(result[0].filePath).toBe(componentPath);
  });

  it("should extract multiple hooks from a component", () => {
    const componentsDir = join(tempDir, "components");
    mkdirSync(componentsDir);

    const componentPath = join(componentsDir, "Form.tsx");
    const componentContent = `
import { useState, useEffect, useCallback } from "react";

export function Form() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Some effect
  }, [value]);

  const handleSubmit = useCallback(() => {
    // Handle submit
  }, [value]);

  return <form>{value}</form>;
}
`;
    writeFileSync(componentPath, componentContent, "utf-8");

    const result = detectComponents([componentsDir]);

    expect(result).toHaveLength(1);
    expect(result[0].hooks).toEqual(["useCallback", "useEffect", "useState"]);
  });

  it("should handle components with no props", () => {
    const componentsDir = join(tempDir, "components");
    mkdirSync(componentsDir);

    const componentPath = join(componentsDir, "Logo.tsx");
    const componentContent = `
export function Logo() {
  return <img src="/logo.png" alt="Logo" />;
}
`;
    writeFileSync(componentPath, componentContent, "utf-8");

    const result = detectComponents([componentsDir]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Logo",
      filePath: componentPath,
      isExported: true,
      hasProps: false,
      propsInterface: undefined,
      hooks: [],
    });
  });

  it("should skip story files", () => {
    const componentsDir = join(tempDir, "components");
    mkdirSync(componentsDir);

    const storyPath = join(componentsDir, "Button.stories.tsx");
    const storyContent = `
export function StoryButton() {
  return <button>Story</button>;
}
`;
    writeFileSync(storyPath, storyContent, "utf-8");

    const result = detectComponents([componentsDir]);

    expect(result).toEqual([]);
  });

  it("should handle multiple directories", () => {
    const dir1 = join(tempDir, "components");
    const dir2 = join(tempDir, "widgets");
    mkdirSync(dir1);
    mkdirSync(dir2);

    writeFileSync(
      join(dir1, "Button.tsx"),
      "export function Button() { return <button>Click</button>; }",
      "utf-8",
    );
    writeFileSync(
      join(dir2, "Widget.tsx"),
      "export function Widget() { return <div>Widget</div>; }",
      "utf-8",
    );

    const result = detectComponents([dir1, dir2]);

    expect(result).toHaveLength(2);
    expect(result.map((c) => c.name).sort()).toEqual(["Button", "Widget"]);
  });

  it("should detect arrow function component without explicit FC type", () => {
    const componentsDir = join(tempDir, "components");
    mkdirSync(componentsDir);

    const componentPath = join(componentsDir, "Badge.tsx");
    const componentContent = `
export const Badge = ({ text }: { text: string }) => {
  return <span>{text}</span>;
};
`;
    writeFileSync(componentPath, componentContent, "utf-8");

    const result = detectComponents([componentsDir]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Badge",
      filePath: componentPath,
      isExported: true,
      hasProps: true,
      propsInterface: "{ text: string }",
      hooks: [],
    });
  });

  it("should skip files that are not components", () => {
    const componentsDir = join(tempDir, "components");
    mkdirSync(componentsDir);

    // Utility file with lowercase function
    const utilPath = join(componentsDir, "utils.ts");
    const utilContent = `
export function formatDate(date: Date) {
  return date.toISOString();
}
`;
    writeFileSync(utilPath, utilContent, "utf-8");

    // Type definition file
    const typesPath = join(componentsDir, "types.d.ts");
    const typesContent = `
export interface User {
  id: string;
  name: string;
}
`;
    writeFileSync(typesPath, typesContent, "utf-8");

    const result = detectComponents([componentsDir]);

    expect(result).toEqual([]);
  });
});
