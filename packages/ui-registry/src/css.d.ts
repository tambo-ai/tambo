// Ambient declarations for CSS side-effect imports (e.g. `import "pkg/styles.css"`).
// Bundlers and Next.js resolve these at build time; TypeScript only needs the
// module to exist so side-effect imports type-check (required since TS 6.0, which
// errors on unresolved side-effect imports via TS2882).
declare module "*.css";
