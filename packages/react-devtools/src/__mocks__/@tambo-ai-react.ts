import { vi } from "vitest";

export const useTamboDevtoolsEvents = vi.fn().mockReturnValue({
  events: [],
  clearEvents: vi.fn(),
});

export const useTamboRegistry = vi.fn().mockReturnValue({
  __initialized: true,
  componentList: {},
  toolRegistry: {},
  componentToolAssociations: {},
  mcpServerInfos: [],
  resources: [],
  resourceSource: null,
  registerComponent: vi.fn(),
  registerTool: vi.fn(),
  registerTools: vi.fn(),
  addToolAssociation: vi.fn(),
  registerMcpServer: vi.fn(),
  registerMcpServers: vi.fn(),
  registerResource: vi.fn(),
  registerResources: vi.fn(),
  registerResourceSource: vi.fn(),
});
