import React from "react";
import { renderHook, act, render, waitFor } from "@testing-library/react";
import { z } from "zod";
import {
  resolveAdditionalContext,
  setHelpers,
} from "../../context-helpers/registry";
import { TamboStubProvider } from "../../providers/tambo-stubs";
import { useTamboContextHelpers } from "../../providers/tambo-context-helpers-provider";
import { TamboInteractableProvider } from "../../providers/tambo-interactable-provider";
import { withTamboInteractable } from "../hoc/with-tambo-interactable";

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
      {children}
    </TamboStubProvider>
  );
}

describe("Interactables AdditionalContext (default)", () => {
  beforeEach(() => {
    // Clear global helpers between tests
    setHelpers({});
  });

  test("registers default helper and returns payload with description and components", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;

    const InteractableNote = withTamboInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    // Render a full tree with Interactable provider so HOC can register
    render(
      wrapperWithProviders(
        <TamboInteractableProvider>
          <InteractableNote title="hello" />
        </TamboInteractableProvider>,
      ),
    );

    await waitFor(async () => {
      const contexts = await resolveAdditionalContext();
      const entry = contexts.find((c) => c.name === "interactables");
      expect(entry).toBeDefined();
      expect(entry?.context?.description).toMatch(/interactable components/i);
      expect(Array.isArray(entry?.context?.components)).toBe(true);
      const comp = entry!.context.components[0];
      expect(comp.componentName).toBe("Note");
      expect(comp.props).toEqual({ title: "hello" });
    });
  });

  test("override: custom helper under same key is used instead of default", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => wrapperWithProviders(children),
    });

    act(() => {
      result.current.addContextHelper("interactables", () => ({ custom: 1 }));
    });

    const contexts = await resolveAdditionalContext();
    const entry = contexts.find((c) => c.name === "interactables");
    expect(entry?.context).toEqual({ custom: 1 });
  });

  test("disable: helper that returns null removes entry", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => wrapperWithProviders(children),
    });

    act(() => {
      result.current.addContextHelper("interactables", () => null);
    });

    const contexts = await resolveAdditionalContext();
    const entry = contexts.find((c) => c.name === "interactables");
    expect(entry).toBeUndefined();
  });

  test("update: when an interactable updates props, payload reflects the latest props", async () => {
    const Counter: React.FC<{ count: number }> = ({ count }) => (
      <div>{count}</div>
    );

    const InteractableCounter = withTamboInteractable(Counter, {
      componentName: "Counter",
      description: "A counter",
      propsSchema: z.object({ count: z.number() }),
    });

    // Use stateful test host to update props
    const Host: React.FC = () => {
      const [count, setCount] = React.useState(1);
      React.useEffect(() => {
        const t = setTimeout(() => setCount(5), 0);
        return () => clearTimeout(t);
      }, []);
      return <InteractableCounter count={count} />;
    };

    render(
      wrapperWithProviders(
        <TamboInteractableProvider>
          <Host />
        </TamboInteractableProvider>,
      ),
    );

    await waitFor(async () => {
      const contexts = await resolveAdditionalContext();
      const entry = contexts.find((c) => c.name === "interactables");
      expect(entry).toBeDefined();
      const props = entry!.context.components[0].props;
      // Eventually reflects the updated count = 5
      expect(props).toEqual({ count: 5 });
    });
  });
});
