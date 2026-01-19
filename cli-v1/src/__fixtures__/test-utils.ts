import fs from "fs";

import { jest } from "@jest/globals";

export class ProcessExitError extends Error {
  readonly code: number | undefined;

  constructor(code?: number) {
    super(`ProcessExit:${code ?? ""}`);
    this.name = "ProcessExitError";
    this.code = code;
  }
}

export async function captureStdout(
  fn: () => void | Promise<void>,
): Promise<string> {
  const originalLog = console.log;
  const logs: string[] = [];
  console.log = (...args: unknown[]) => {
    logs.push(args.map((arg) => String(arg)).join(" "));
  };

  try {
    await fn();
  } catch (error) {
    if (!(error instanceof ProcessExitError)) {
      throw error;
    }
  } finally {
    console.log = originalLog;
  }

  return logs.join("\n");
}

interface MockFsResult {
  existsSpy: jest.SpiedFunction<typeof fs.existsSync>;
  readSpy: jest.SpiedFunction<typeof fs.readFileSync>;
  writeSpy: jest.SpiedFunction<typeof fs.writeFileSync>;
  getFile: (path: string) => string | undefined;
}

export function mockFs(files: Record<string, string>): MockFsResult {
  const fileMap = new Map(Object.entries(files));

  const existsSpy = jest.spyOn(fs, "existsSync").mockImplementation((path) => {
    return fileMap.has(String(path));
  });

  const readSpy = jest.spyOn(fs, "readFileSync").mockImplementation((path) => {
    const value = fileMap.get(String(path));
    if (typeof value === "undefined") {
      throw new Error(
        `ENOENT: no such file or directory, open '${String(path)}'`,
      );
    }
    return value;
  });

  const writeSpy = jest
    .spyOn(fs, "writeFileSync")
    .mockImplementation((path, data) => {
      fileMap.set(String(path), String(data));
    });

  return {
    existsSpy,
    readSpy,
    writeSpy,
    getFile: (path: string) => fileMap.get(path),
  };
}

export function mockProcessExit(): jest.SpiedFunction<typeof process.exit> {
  return jest
    .spyOn(process, "exit")
    .mockImplementation((code?: number | string | null) => {
      const normalizedCode = typeof code === "number" ? code : undefined;
      throw new ProcessExitError(normalizedCode);
    });
}

export function setIsTTY(value: boolean): void {
  Object.defineProperty(process.stdout, "isTTY", {
    value,
    configurable: true,
  });
}

export function withArgs<T extends Record<string, unknown>>(
  args: T,
): T & { _: string[] } {
  return { _: [], ...args };
}

export function makeContext<T extends Record<string, unknown>>(
  args: T & { _: string[] },
) {
  return { rawArgs: [], args, cmd: {} };
}

export function getSubcommand(
  command: { subCommands?: unknown },
  name: string,
):
  | { run?: (ctx: { args: Record<string, unknown> }) => Promise<void> }
  | undefined {
  const subCommands = command.subCommands as
    | Record<
        string,
        { run?: (ctx: { args: Record<string, unknown> }) => Promise<void> }
      >
    | undefined;
  return subCommands?.[name];
}

export function resetMocks(): void {
  jest.clearAllMocks();
  jest.restoreAllMocks();
}
