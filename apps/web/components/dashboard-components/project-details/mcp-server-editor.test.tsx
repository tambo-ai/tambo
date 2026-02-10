import { MCPTransport } from "@tambo-ai-cloud/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { McpServerEditor, type MCPServerInfo } from "./mcp-server-editor";

// Mock tRPC api
jest.mock("@/trpc/react", () => ({
  api: {
    tools: {
      authorizeMcpServer: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
          error: null,
          data: null,
        }),
      },
    },
    project: {
      removeMultipleProjects: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn(),
          isPending: false,
        })),
      },
    },
  },
}));

// Mock toast
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const baseServer: MCPServerInfo = {
  id: "tp_123",
  url: "https://mcp.example.com",
  serverKey: "example",
  customHeaders: { Authorization: "Bearer token123" },
  mcpTransport: MCPTransport.HTTP,
  mcpRequiresAuth: false,
  mcpIsAuthed: false,
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderEditor(
  overrides?: Partial<React.ComponentProps<typeof McpServerEditor>>,
) {
  const queryClient = createQueryClient();
  const onSave = jest.fn().mockResolvedValue(baseServer);
  const onCancel = jest.fn();
  const onEdit = jest.fn();
  const onDelete = jest.fn();

  const props: React.ComponentProps<typeof McpServerEditor> = {
    server: baseServer,
    isEditing: true,
    isNew: false,
    error: null,
    isSaving: false,
    isDeleting: false,
    errorMessage: null,
    onEdit,
    onCancel,
    onSave,
    onDelete,
    ...overrides,
  };

  const view = render(
    <QueryClientProvider client={queryClient}>
      <McpServerEditor {...props} />
    </QueryClientProvider>,
  );
  return { onSave, onCancel, onEdit, onDelete, ...view };
}

describe("McpServerEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders server URL and headers", () => {
    renderEditor();

    expect(
      screen.getByDisplayValue("https://mcp.example.com"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Authorization")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bearer token123")).toBeInTheDocument();
  });

  it("passes updated headers directly to onSave to avoid stale closure", async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor();

    // Find the header value input and update it
    const valueInput = screen.getByDisplayValue("Bearer token123");
    await user.clear(valueInput);
    await user.type(valueInput, "Bearer newtoken456");

    // Click the save button on the header row
    const saveHeaderButton = screen.getByRole("button", {
      name: /save header/i,
    });
    await user.click(saveHeaderButton);

    // Verify onSave was called with the NEW header value, not the old one
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          customHeaders: { Authorization: "Bearer newtoken456" },
        }),
      );
    });
  });

  it("saves with empty headers when all headers are cleared", async () => {
    const user = userEvent.setup();
    const serverWithEmptyHeaders: MCPServerInfo = {
      ...baseServer,
      customHeaders: {},
    };
    const { onSave } = renderEditor({ server: serverWithEmptyHeaders });

    // Click the main save button (URL field triggers save)
    const urlInput = screen.getByDisplayValue("https://mcp.example.com");
    await user.clear(urlInput);
    await user.type(urlInput, "https://new.example.com{enter}");

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://new.example.com",
          customHeaders: {},
        }),
      );
    });
  });

  it("includes all form fields when saving", async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor();

    // Trigger save via Enter key on URL input
    const urlInput = screen.getByDisplayValue("https://mcp.example.com");
    await user.type(urlInput, "{enter}");

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        url: "https://mcp.example.com",
        serverKey: "example",
        customHeaders: { Authorization: "Bearer token123" },
        mcpTransport: MCPTransport.HTTP,
      });
    });
  });
});
