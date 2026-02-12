import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectProviders } from "./provider-detection.js";

describe("detectProviders", () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = mkdtempSync(join(tmpdir(), "provider-detection-test-"));
  });

  afterEach(() => {
    // Clean up temporary directory
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect nested providers with correct nesting levels and import sources", () => {
    const layoutPath = join(tempDir, "layout.tsx");
    const layoutContent = `
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/auth";

export default function RootLayout({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
`;
    writeFileSync(layoutPath, layoutContent, "utf-8");

    const result = detectProviders(layoutPath);

    expect(result).toHaveLength(2);

    // ThemeProvider should be at level 0 (outermost)
    expect(result[0]).toEqual({
      name: "ThemeProvider",
      importSource: "next-themes",
      filePath: layoutPath,
      nestingLevel: 0,
    });

    // AuthProvider should be at level 1 (nested inside ThemeProvider)
    expect(result[1]).toEqual({
      name: "AuthProvider",
      importSource: "@/contexts/auth",
      filePath: layoutPath,
      nestingLevel: 1,
    });
  });

  it("should return empty array for layout with no providers", () => {
    const layoutPath = join(tempDir, "layout.tsx");
    const layoutContent = `
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
`;
    writeFileSync(layoutPath, layoutContent, "utf-8");

    const result = detectProviders(layoutPath);

    expect(result).toEqual([]);
  });

  it("should detect self-closing provider elements", () => {
    const layoutPath = join(tempDir, "layout.tsx");
    const layoutContent = `
import { QueryProvider } from "@tanstack/react-query";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider />
        {children}
      </body>
    </html>
  );
}
`;
    writeFileSync(layoutPath, layoutContent, "utf-8");

    const result = detectProviders(layoutPath);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "QueryProvider",
      importSource: "@tanstack/react-query",
      filePath: layoutPath,
      nestingLevel: 0,
    });
  });

  it("should return empty array when file does not exist", () => {
    const nonExistentPath = join(tempDir, "does-not-exist.tsx");

    const result = detectProviders(nonExistentPath);

    expect(result).toEqual([]);
  });

  it("should handle providers imported as default imports", () => {
    const layoutPath = join(tempDir, "layout.tsx");
    const layoutContent = `
import ThemeProvider from "next-themes";

export default function RootLayout({ children }) {
  return (
    <ThemeProvider>{children}</ThemeProvider>
  );
}
`;
    writeFileSync(layoutPath, layoutContent, "utf-8");

    const result = detectProviders(layoutPath);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "ThemeProvider",
      importSource: "next-themes",
      filePath: layoutPath,
      nestingLevel: 0,
    });
  });

  it("should handle multiple levels of nesting", () => {
    const layoutPath = join(tempDir, "layout.tsx");
    const layoutContent = `
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/auth";
import { DataProvider } from "@/contexts/data";

export default function RootLayout({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>{children}</DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
`;
    writeFileSync(layoutPath, layoutContent, "utf-8");

    const result = detectProviders(layoutPath);

    expect(result).toHaveLength(3);
    expect(result[0].nestingLevel).toBe(0); // ThemeProvider
    expect(result[1].nestingLevel).toBe(1); // AuthProvider
    expect(result[2].nestingLevel).toBe(2); // DataProvider
  });

  it("should skip components that do not end with Provider", () => {
    const layoutPath = join(tempDir, "layout.tsx");
    const layoutContent = `
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/header";

export default function RootLayout({ children }) {
  return (
    <ThemeProvider>
      <Header />
      {children}
    </ThemeProvider>
  );
}
`;
    writeFileSync(layoutPath, layoutContent, "utf-8");

    const result = detectProviders(layoutPath);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("ThemeProvider");
  });
});
