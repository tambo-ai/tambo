"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type SelectControlDef = {
  type: "select";
  options: readonly string[];
  default: string;
  label?: string;
};

type BooleanControlDef = {
  type: "boolean";
  default: boolean;
  label?: string;
};

export type ControlDef = SelectControlDef | BooleanControlDef;

export type ControlSchema = Record<string, ControlDef>;

interface DemoState {
  expanded: boolean;
  setExpanded: (value: boolean | ((prev: boolean) => boolean)) => void;
  controlSchema: ControlSchema | null;
  controlValues: Record<string, string | boolean>;
  registerControls: (schema: ControlSchema) => void;
  setControlValue: (key: string, value: string | boolean) => void;
}

const DemoContext = createContext<DemoState | null>(null);

/**
 * Provides shared demo state (expanded, controls) to DemoPreview and child
 * demo components.
 *
 * @returns Provider wrapping demo content with shared state.
 */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [controlSchema, setControlSchema] = useState<ControlSchema | null>(
    null,
  );
  const [controlValues, setControlValues] = useState<
    Record<string, string | boolean>
  >({});

  const registerControls = useCallback((newSchema: ControlSchema) => {
    setControlSchema(newSchema);
    const defaults: Record<string, string | boolean> = {};
    for (const [key, def] of Object.entries(newSchema)) {
      defaults[key] = def.default;
    }
    setControlValues(defaults);
  }, []);

  const setControlValue = useCallback(
    (key: string, value: string | boolean) => {
      setControlValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return (
    <DemoContext.Provider
      value={{
        expanded,
        setExpanded,
        controlSchema,
        controlValues,
        registerControls,
        setControlValue,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

/**
 * Access shared demo state from within a DemoProvider.
 *
 * @returns The current demo context state.
 */
export function useDemoContext() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error("useDemoContext must be used within DemoProvider");
  }
  return ctx;
}
