/**
 * Entry point for the Tambo DevTools bridge.
 *
 * Import from `@tambo-ai/react/devtools` to enable real-time debugging.
 * This subpath is completely isolated from the main `@tambo-ai/react` entry
 * and adds zero bytes to production builds that do not import it.
 */
export { TamboDevTools } from "./tambo-dev-tools";
export type { TamboDevToolsProps } from "./tambo-dev-tools";
export type {
  DevToolsMessage,
  DevToolsServerMessage,
  DevToolsDashboardMessage,
  DevToolsDashboardCommand,
} from "./devtools-protocol";
export {
  DEVTOOLS_DEFAULT_PORT,
  DEVTOOLS_DEFAULT_HOST,
  DEVTOOLS_PROTOCOL_VERSION,
} from "./devtools-protocol";
