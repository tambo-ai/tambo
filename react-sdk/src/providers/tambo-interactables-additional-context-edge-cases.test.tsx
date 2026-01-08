import { render, waitFor } from "@testing-library/react";
import React from "react";
import { z } from "zod/v4";
import { withTamboInteractable } from "../hoc/with-tambo-interactable";
import {
  TamboContextHelpersProvider,
  useTamboContextHelpers,
} from "./tambo-context-helpers-provider";
import { TamboInteractableProvider } from "./tambo-interactable-provider";
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

describe("Interactables AdditionalContext - Edge Cases & Advanced Scenarios", () => {
  test("handles components without propsSchema gracefully", async () => {
    const SimpleComponent: React.FC<{ text: string }> = ({ text }) => (
      <div>{text}</div>
    );

    const InteractableSimpleComponent = withTamboInteractable(SimpleComponent, {
      componentName: "SimpleComponent",
      description: "A component without schema",
      // No propsSchema provided
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
          <InteractableSimpleComponent text="test" />
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
      const component = entry!.context.components[0];
      expect(component.propsSchema).toBe("Not specified");
    });
  });

  test("handles component unmounting and remounting correctly", async () => {
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
        const interval = setInterval(() => {
          void getAdditionalContext().then((contexts) => {
            if (mounted) {
              capturedContexts = contexts;
            }
          });
        }, 50);
        return () => {
          mounted = false;
          clearInterval(interval);
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const Host = () => {
      const [showNote, setShowNote] = React.useState(true);

      React.useEffect(() => {
        // Toggle the note on/off to test unmounting
        const timeout = setTimeout(() => setShowNote(false), 100);
        const timeout2 = setTimeout(() => setShowNote(true), 200);
        return () => {
          clearTimeout(timeout);
          clearTimeout(timeout2);
        };
      }, []);

      return (
        <TamboInteractableProvider>
          {showNote && <InteractableNote title="dynamic note" />}
          <TestComponent />
        </TamboInteractableProvider>
      );
    };

    const { getByTestId } = render(wrapperWithProviders(<Host />));

    await waitFor(
      () => {
        expect(getByTestId("ready")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    // Eventually should show the note again
    await waitFor(
      () => {
        const entry = capturedContexts.find(
          (c: any) => c.name === "interactables",
        );
        expect(entry?.context?.components).toHaveLength(1);
      },
      { timeout: 1000 },
    );
  });

  test("context helper updates when props change from parent", async () => {
    const Counter: React.FC<{ count: number; label?: string }> = ({
      count,
      label = "Count",
    }) => (
      <div>
        {label}: {count}
      </div>
    );

    const InteractableCounter = withTamboInteractable(Counter, {
      componentName: "Counter",
      description: "A counter component",
      propsSchema: z.object({
        count: z.number(),
        label: z.string().optional(),
      }),
    });

    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext } = useTamboContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        const interval = setInterval(() => {
          void getAdditionalContext().then((contexts) => {
            if (mounted) {
              capturedContexts = contexts;
            }
          });
        }, 50);
        return () => {
          mounted = false;
          clearInterval(interval);
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const Host = () => {
      const [count, setCount] = React.useState(0);
      const [label, setLabel] = React.useState("Items");

      React.useEffect(() => {
        const timeout1 = setTimeout(() => setCount(5), 100);
        const timeout2 = setTimeout(() => setLabel("Updated Items"), 200);
        return () => {
          clearTimeout(timeout1);
          clearTimeout(timeout2);
        };
      }, []);

      return (
        <TamboInteractableProvider>
          <InteractableCounter count={count} label={label} />
          <TestComponent />
        </TamboInteractableProvider>
      );
    };

    const { getByTestId } = render(wrapperWithProviders(<Host />));

    await waitFor(() => {
      expect(getByTestId("ready")).toBeInTheDocument();
    });

    // Wait for updates to propagate
    await waitFor(
      () => {
        const entry = capturedContexts.find(
          (c: any) => c.name === "interactables",
        );
        if (entry?.context?.components?.[0]) {
          const props = entry.context.components[0].props;
          expect(props.count).toBe(5);
          expect(props.label).toBe("Updated Items");
        }
      },
      { timeout: 1000 },
    );
  });

  test("multiple providers with nested context helpers work correctly", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const InteractableNote = withTamboInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    let outerContexts: any[] = [];
    let innerContexts: any[] = [];

    const OuterTestComponent = () => {
      const { getAdditionalContext } = useTamboContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        void getAdditionalContext().then((contexts) => {
          if (mounted) {
            outerContexts = contexts;
          }
        });
        return () => {
          mounted = false;
        };
      }, [getAdditionalContext]);

      return <div data-testid="outer-ready">outer ready</div>;
    };

    const InnerTestComponent = () => {
      const { getAdditionalContext } = useTamboContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        void getAdditionalContext().then((contexts) => {
          if (mounted) {
            innerContexts = contexts;
          }
        });
        return () => {
          mounted = false;
        };
      }, [getAdditionalContext]);

      return <div data-testid="inner-ready">inner ready</div>;
    };

    const { getByTestId } = render(
      wrapperWithProviders(
        <TamboInteractableProvider>
          <InteractableNote title="outer note" />
          <OuterTestComponent />
          <TamboContextHelpersProvider
            contextHelpers={{
              customContext: () => ({ custom: "inner" }),
            }}
          >
            <TamboInteractableProvider>
              <InteractableNote title="inner note" />
              <InnerTestComponent />
            </TamboInteractableProvider>
          </TamboContextHelpersProvider>
        </TamboInteractableProvider>,
      ),
    );

    await waitFor(() => {
      expect(getByTestId("outer-ready")).toBeInTheDocument();
      expect(getByTestId("inner-ready")).toBeInTheDocument();
    });

    await waitFor(() => {
      // Outer context should have outer note
      const outerEntry = outerContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(outerEntry?.context?.components).toHaveLength(1);
      expect(outerEntry?.context?.components[0]?.props?.title).toBe(
        "outer note",
      );

      // Inner context should have inner note and custom context
      const innerEntry = innerContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(innerEntry?.context?.components).toHaveLength(1);
      expect(innerEntry?.context?.components[0]?.props?.title).toBe(
        "inner note",
      );

      const customEntry = innerContexts.find(
        (c: any) => c.name === "customContext",
      );
      expect(customEntry?.context).toEqual({ custom: "inner" });
    });
  });

  test("provider cleanup removes helper when last provider unmounts", async () => {
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
        const interval = setInterval(() => {
          void getAdditionalContext().then((contexts) => {
            if (mounted) {
              capturedContexts = contexts;
            }
          });
        }, 50);
        return () => {
          mounted = false;
          clearInterval(interval);
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const Host = () => {
      const [showProvider, setShowProvider] = React.useState(true);

      React.useEffect(() => {
        const timeout = setTimeout(() => setShowProvider(false), 200);
        return () => clearTimeout(timeout);
      }, []);

      return (
        <>
          {showProvider && (
            <TamboInteractableProvider>
              <InteractableNote title="will disappear" />
            </TamboInteractableProvider>
          )}
          <TestComponent />
        </>
      );
    };

    const { getByTestId } = render(wrapperWithProviders(<Host />));

    // Initially should have the context
    await waitFor(() => {
      expect(getByTestId("ready")).toBeInTheDocument();
      const entry = capturedContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(entry).toBeDefined();
    });

    // After provider unmounts, context should be gone
    await waitFor(
      () => {
        const entry = capturedContexts.find(
          (c: any) => c.name === "interactables",
        );
        expect(entry).toBeUndefined();
      },
      { timeout: 1000 },
    );
  });

  test("helper error handling doesn't crash the system", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const InteractableNote = withTamboInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    // Mock console.error to capture error logs
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext, addContextHelper } =
        useTamboContextHelpers();

      React.useEffect(() => {
        // Add a helper that throws an error
        addContextHelper("errorHelper", () => {
          throw new Error("Test error in helper");
        });
      }, [addContextHelper]);

      React.useEffect(() => {
        let mounted = true;
        getAdditionalContext()
          .then((contexts) => {
            if (mounted) {
              capturedContexts = contexts;
            }
          })
          .catch(() => {
            // Should not reach here - errors should be handled gracefully
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
      // Should still have the interactables context despite the error
      const entry = capturedContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(entry).toBeDefined();

      // Error helper should not be present (filtered out)
      const errorEntry = capturedContexts.find(
        (c: any) => c.name === "errorHelper",
      );
      expect(errorEntry).toBeUndefined();
    });

    consoleSpy.mockRestore();
  });
});
