import fs from "fs";
import os from "os";
import path from "path";
import { detectToolCandidates } from "./tool-detection";

describe("detectToolCandidates", () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a unique temp directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tool-detection-test-"));
  });

  afterEach(() => {
    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("detects server actions with top-level use server directive", () => {
    const actionsFile = path.join(tempDir, "actions.ts");
    fs.writeFileSync(
      actionsFile,
      `"use server";

/**
 * Creates a new user
 */
export async function createUser(name: string) {
  return { id: 1, name };
}

export async function deleteUser(id: number) {
  return true;
}
`,
    );

    const candidates = detectToolCandidates(tempDir);

    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({
      name: "createUser",
      filePath: actionsFile,
      type: "server-action",
      description: "Creates a new user",
    });
    expect(candidates[1]).toMatchObject({
      name: "deleteUser",
      filePath: actionsFile,
      type: "server-action",
    });
  });

  it("detects server actions with function-level use server directive", () => {
    const utilsFile = path.join(tempDir, "utils.ts");
    fs.writeFileSync(
      utilsFile,
      `export async function regularFunction() {
  return "not a server action";
}

export async function serverAction() {
  "use server";
  return "this is a server action";
}
`,
    );

    const candidates = detectToolCandidates(tempDir);

    expect(candidates).toHaveLength(2);
    const serverAction = candidates.find((c) => c.name === "serverAction");
    expect(serverAction).toMatchObject({
      type: "server-action",
    });
    const regularFunc = candidates.find((c) => c.name === "regularFunction");
    expect(regularFunc).toMatchObject({
      type: "exported-function",
    });
  });

  it("detects fetch calls in exported functions", () => {
    const apiFile = path.join(tempDir, "api.ts");
    fs.writeFileSync(
      apiFile,
      `/**
 * Fetches user data from API
 */
export async function getUser(id: string) {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}

export async function normalFunction() {
  return "no fetch here";
}
`,
    );

    const candidates = detectToolCandidates(tempDir);

    const fetchCandidate = candidates.find((c) => c.name === "getUser");
    expect(fetchCandidate).toMatchObject({
      name: "getUser",
      filePath: apiFile,
      type: "fetch",
      description: "Fetches user data from API",
    });
  });

  it("detects axios calls in exported functions", () => {
    const apiFile = path.join(tempDir, "api.ts");
    fs.writeFileSync(
      apiFile,
      `import axios from 'axios';

export async function fetchData() {
  const response = await axios.get('/api/data');
  return response.data;
}

export async function postData(data: unknown) {
  return axios.post('/api/data', data);
}
`,
    );

    const candidates = detectToolCandidates(tempDir);

    expect(candidates.length).toBeGreaterThanOrEqual(2);
    const axiosGetCandidate = candidates.find((c) => c.name === "fetchData");
    expect(axiosGetCandidate).toMatchObject({
      type: "axios",
    });
    const axiosPostCandidate = candidates.find((c) => c.name === "postData");
    expect(axiosPostCandidate).toMatchObject({
      type: "axios",
    });
  });

  it("excludes React components from tool candidates", () => {
    const componentFile = path.join(tempDir, "Component.tsx");
    fs.writeFileSync(
      componentFile,
      `export async function MyComponent() {
  const data = await fetch('/api/data');
  return <div>Hello</div>;
}

export async function useData() {
  return fetch('/api/data');
}
`,
    );

    const candidates = detectToolCandidates(tempDir);

    // MyComponent should be excluded (React component with JSX)
    // useData should be included (fetch call, not a component)
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.name).toBe("useData");
  });

  it("skips test files", () => {
    const testFile = path.join(tempDir, "utils.test.ts");
    fs.writeFileSync(
      testFile,
      `export async function testHelper() {
  "use server";
  return true;
}
`,
    );

    const specFile = path.join(tempDir, "utils.spec.ts");
    fs.writeFileSync(
      specFile,
      `export async function specHelper() {
  return fetch('/api/test');
}
`,
    );

    const candidates = detectToolCandidates(tempDir);

    expect(candidates).toHaveLength(0);
  });

  it("deduplicates server actions from exported functions", () => {
    const actionsFile = path.join(tempDir, "actions.ts");
    fs.writeFileSync(
      actionsFile,
      `"use server";

export async function myAction() {
  return true;
}
`,
    );

    const candidates = detectToolCandidates(tempDir);

    // Should only appear once as server-action, not also as exported-function
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      name: "myAction",
      type: "server-action",
    });
  });

  it("caps results at 30 candidates", () => {
    // Create 35 files with server actions
    for (let i = 0; i < 35; i++) {
      const file = path.join(tempDir, `action${i}.ts`);
      fs.writeFileSync(
        file,
        `"use server";
export async function action${i}() {
  return ${i};
}
`,
      );
    }

    const candidates = detectToolCandidates(tempDir);

    expect(candidates).toHaveLength(30);
  });

  it("handles files with no tool candidates", () => {
    const emptyFile = path.join(tempDir, "empty.ts");
    fs.writeFileSync(emptyFile, "const x = 1;\nexport { x };\n");

    const candidates = detectToolCandidates(tempDir);

    expect(candidates).toHaveLength(0);
  });

  it("sorts results by file path and name", () => {
    const fileA = path.join(tempDir, "a.ts");
    fs.writeFileSync(
      fileA,
      `"use server";
export async function zebra() {}
export async function alpha() {}
`,
    );

    const fileB = path.join(tempDir, "b.ts");
    fs.writeFileSync(
      fileB,
      `"use server";
export async function beta() {}
`,
    );

    const candidates = detectToolCandidates(tempDir);

    expect(candidates).toHaveLength(3);
    // Sorted by file path first (a.ts before b.ts), then by name within file
    expect(candidates[0]?.name).toBe("alpha");
    expect(candidates[1]?.name).toBe("zebra");
    expect(candidates[2]?.name).toBe("beta");
  });
});
