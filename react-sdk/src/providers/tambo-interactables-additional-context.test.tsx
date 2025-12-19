import { render, waitFor } from "@testing-library/react";
import React from "react";
import { z } from "zod/v4";
import { withTamboInteractable } from "../hoc/with-tambo-interactable";
import {
  TamboContextHelpersProvider,
  useTamboContextHelpers,
} from "./tambo-context-helpers-provider";
import {
  TamboInteractableProvider,
  useCurrentInteractablesSnapshot,
} from "./tambo-interactable-provider";
import { TamboStubProvider } from "./tambo-stubs";

function wrapperWithProviders(children: React.ReactNode) {
  const thread = {
    id: "t-1",
    projectId: "p-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    metadata: {},
  } as any;

  return (
    <TamboStubProvider
      thread={thread}
      registerTool={() => {}}
      registerTools={() => {}}
      registerComponent={() => {}}
      addToolAssociation={() => {}}
    >
      <TamboContextHelpersProvider>{children}</TamboContextHelpersProvider>
    </TamboStubProvider>
  );
}

describe("Interactables AdditionalContext (provider-based)", () => {
  test("registers default helper and returns payload with description and components", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;

    const InteractableNote = withTamboInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext } = useTamboContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        void getAdditionalContext().then((contexts) => {
          if (mounted) {
            capturedContexts = contexts;
          }
        });
        return () => {
          mounted = false;
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const { getByTestId } = render(
      wrapperWithProviders(
        <TamboInteractableProvider>
          <InteractableNote title="hello" />
          <TestComponent />
        </TamboInteractableProvider>,
      ),
    );

    await waitFor(() => {
      expect(getByTestId("ready")).toBeInTheDocument();
      const entry = capturedContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(entry).toBeDefined();
      expect(Array.isArray(entry?.context?.components)).toBe(true);
      const comp = entry!.context.components[0];
      expect(comp.componentName).toBe("Note");
      expect(comp.props).toEqual({ title: "hello" });
    });
  });

  test("returns null when no interactable components are present", async () => {
    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext } = useTamboContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        void getAdditionalContext().then((contexts) => {
          if (mounted) {
            capturedContexts = contexts;
          }
        });
        return () => {
          mounted = false;
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const { getByTestId } = render(
      wrapperWithProviders(
        <TamboInteractableProvider>
          <div>No interactables here</div>
          <TestComponent />
        </TamboInteractableProvider>,
      ),
    );

    await waitFor(() => {
      expect(getByTestId("ready")).toBeInTheDocument();
      const entry = capturedContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(entry).toBeUndefined(); // Should be filtered out when helper returns null
    });
  });

  test("context includes proper AI prompt with clear instructions", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const InteractableNote = withTamboInteractable(Note, {
      componentName: "Note",
      description: "A simple note",
      propsSchema: z.object({ title: z.string() }),
    });

    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext } = useTamboContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        void getAdditionalContext().then((contexts) => {
          if (mounted) {
            capturedContexts = contexts;
          }
        });
        return () => {
          mounted = false;
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const { getByTestId } = render(
      wrapperWithProviders(
        <TamboInteractableProvider>
          <InteractableNote title="test" />
          <TestComponent />
        </TamboInteractableProvider>,
      ),
    );

    await waitFor(() => {
      expect(getByTestId("ready")).toBeInTheDocument();
      const entry = capturedContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(entry).toBeDefined();
      expect(Array.isArray(entry?.context?.components)).toBe(true);
    });
  });

  test("includes component metadata in expected format", async () => {
    const Note: React.FC<{ title: string; color?: string }> = ({
      title,
      color = "white",
    }) => <div className={`note-${color}`}>{title}</div>;

    const InteractableNote = withTamboInteractable(Note, {
      componentName: "Note",
      description: "A colorful note component",
      propsSchema: z.object({
        title: z.string(),
        color: z.string().optional(),
      }),
    });

    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext } = useTamboContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        void getAdditionalContext().then((contexts) => {
          if (mounted) {
            capturedContexts = contexts;
          }
        });
        return () => {
          mounted = false;
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const { getByTestId } = render(
      wrapperWithProviders(
        <TamboInteractableProvider>
          <InteractableNote title="test note" color="blue" />
          <TestComponent />
        </TamboInteractableProvider>,
      ),
    );

    await waitFor(() => {
      expect(getByTestId("ready")).toBeInTheDocument();
      const entry = capturedContexts.find(
        (c: any) => c.name === "interactables",
      );
      const component = entry!.context.components[0];

      expect(component).toMatchObject({
        id: expect.any(String),
        componentName: "Note",
        description: "A colorful note component",
        props: { title: "test note", color: "blue" },
        propsSchema: "Available - use component-specific update tools",
      });
    });
  });

  test("snapshot hook returns immutable copies", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const InteractableNote = withTamboInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    const TestComponent = () => {
      const snapshot = useCurrentInteractablesSnapshot();
      const [testResult, setTestResult] = React.useState<string>("pending");

      React.useEffect(() => {
        if (snapshot.length > 0) {
          const originalLength = snapshot.length;

          // Try to mutate the returned array and props
          snapshot.push({
            id: "fake",
            name: "Fake",
            description: "",
            component: () => null,
            props: {},
          } as any);
          (snapshot[0].props as any).title = "MUTATED";

          // The mutations should succeed on the returned copy, proving it's a separate object
          if (
            snapshot.length === originalLength + 1 &&
            snapshot[0].props.title === "MUTATED"
          ) {
            setTestResult("mutation-successful-but-isolated");
          } else {
            setTestResult("mutation-failed");
          }
        }
      }, [snapshot]);

      return <div data-testid="test-result">{testResult}</div>;
    };

    const { getByTestId } = render(
      wrapperWithProviders(
        <TamboInteractableProvider>
          <InteractableNote title="immutable test" />
          <TestComponent />
        </TamboInteractableProvider>,
      ),
    );

    await waitFor(() => {
      const result = getByTestId("test-result").textContent;
      expect(result).toBe("mutation-successful-but-isolated");
    });
  });

  test("multiple interactables from same provider appear in context", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const Counter: React.FC<{ count: number }> = ({ count }) => (
      <div>{count}</div>
    );

    const InteractableNote = withTamboInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    const InteractableCounter = withTamboInteractable(Counter, {
      componentName: "Counter",
      description: "A counter",
      propsSchema: z.object({ count: z.number() }),
    });

    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext } = useTamboContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        void getAdditionalContext().then((contexts) => {
          if (mounted) {
            capturedContexts = contexts;
          }
        });
        return () => {
          mounted = false;
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const { getByTestId } = render(
      wrapperWithProviders(
        <TamboInteractableProvider>
          <InteractableNote title="first" />
          <InteractableCounter count={42} />
          <TestComponent />
        </TamboInteractableProvider>,
      ),
    );

    await waitFor(() => {
      expect(getByTestId("ready")).toBeInTheDocument();
      const entry = capturedContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(entry?.context?.components).toHaveLength(2);

      const components = entry!.context.components;
      expect(components[0].componentName).toBe("Note");
      expect(components[0].props).toEqual({ title: "first" });
      expect(components[1].componentName).toBe("Counter");
      expect(components[1].props).toEqual({ count: 42 });
    });
  });

  test("can be disabled by returning null", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const InteractableNote = withTamboInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    // Create a context helpers provider with a disabled interactables helper
    const DisabledContextHelpers = ({
      children,
    }: {
      children: React.ReactNode;
    }) => (
      <TamboContextHelpersProvider
        contextHelpers={{
          ["interactables"]: () => null,
        }}
      >
        {children}
      </TamboContextHelpersProvider>
    );

    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext } = useTamboContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        void getAdditionalContext().then((contexts) => {
          if (mounted) {
            capturedContexts = contexts;
          }
        });
        return () => {
          mounted = false;
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const thread = {
      id: "t-1",
      projectId: "p-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      metadata: {},
    } as any;

    const { getByTestId } = render(
      <TamboStubProvider
        thread={thread}
        registerTool={() => {}}
        registerTools={() => {}}
        registerComponent={() => {}}
        addToolAssociation={() => {}}
      >
        <DisabledContextHelpers>
          <TamboInteractableProvider>
            <InteractableNote title="should not appear" />
            <TestComponent />
          </TamboInteractableProvider>
        </DisabledContextHelpers>
      </TamboStubProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("ready")).toBeInTheDocument();
      const entry = capturedContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(entry).toBeUndefined(); // Should be filtered out when helper returns null
    });
  });
});
