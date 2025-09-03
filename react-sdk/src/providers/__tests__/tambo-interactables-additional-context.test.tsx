import React from "react";
import { renderHook, act, render, waitFor } from "@testing-library/react";
import { z } from "zod";
import {
  resolveAdditionalContext,
  setHelpers,
  getHelpers,
} from "../../context-helpers/registry";
import { TamboStubProvider } from "../../providers/tambo-stubs";
import { useTamboContextHelpers } from "../../providers/tambo-context-helpers-provider";
import {
  TamboInteractableProvider,
  getCurrentInteractablesSnapshot,
} from "../../providers/tambo-interactable-provider";
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

describe("Interactables AdditionalContext – multi-provider + snapshot lifecycle", () => {
  beforeEach(() => {
    setHelpers({});
  });

  test("default helper is not overwritten by additional providers and persists until last unmount", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const InteractableNote = withTamboInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    // Mount provider A with an interactable
    const uiA = render(
      wrapperWithProviders(
        <TamboInteractableProvider>
          <InteractableNote title="a" />
        </TamboInteractableProvider>,
      ),
    );

    // Mount provider B (no interactables needed)
    const uiB = render(wrapperWithProviders(<div />));

    // Capture the installed helper fn reference
    // Force resolution once to ensure helper registration side-effects ran
    await resolveAdditionalContext();
    const initialFn = (getHelpers() as any).interactables as any;
    expect(typeof initialFn).toBe("function");

    // Unmount B; helper should still be present and same reference
    uiB.unmount();

    const helpersMapAfterB = getHelpers() as any;
    expect(helpersMapAfterB.interactables).toBe(initialFn);

    const contextsAfterB = await resolveAdditionalContext();
    const entryAfterB = contextsAfterB.find((c) => c.name === "interactables");
    expect(entryAfterB).toBeDefined();

    // Unmount A; now the default helper should be removed entirely
    uiA.unmount();

    const helpersMapAfterAll = getHelpers() as any;
    expect(helpersMapAfterAll.interactables).toBeUndefined();
  });

  test("snapshot reflects provider state while mounted and is cleared on owner unmount", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const InteractableNote = withTamboInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    const ui = render(
      wrapperWithProviders(
        <TamboInteractableProvider>
          <InteractableNote title="hello" />
        </TamboInteractableProvider>,
      ),
    );

    await waitFor(() => {
      expect(getCurrentInteractablesSnapshot().length).toBeGreaterThan(0);
    });

    ui.unmount();

    // Snapshot should be cleared by the owning provider on unmount
    expect(getCurrentInteractablesSnapshot().length).toBe(0);
  });

  test("snapshot accessor returns a copy (external mutation does not affect internal state)", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const InteractableNote = withTamboInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    render(
      wrapperWithProviders(
        <TamboInteractableProvider>
          <InteractableNote title="copy" />
        </TamboInteractableProvider>,
      ),
    );

    await waitFor(() => {
      expect(getCurrentInteractablesSnapshot().length).toBe(1);
    });

    const snap = getCurrentInteractablesSnapshot();
    const originalLength = snap.length;

    // Try to mutate the returned array
    snap.push({
      id: "fake",
      name: "Fake",
      description: "",
      component: () => null,
      props: {},
    } as any);
    snap.length = 0;

    // Internal state should be unaffected
    const next = getCurrentInteractablesSnapshot();
    expect(next.length).toBe(originalLength);
  });
});
