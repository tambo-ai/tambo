// Minimal Node globals/modules to satisfy TS without @types/node in this env.
declare const process: { env: Record<string, string | undefined> };
declare module "fs" {
  const anyFs: any;
  export = anyFs;
}
declare module "path" {
  const anyPath: any;
  export = anyPath;
}
