"use client";

import { cva } from "class-variance-authority";
import { useEffect, useRef } from "react";
import { useDemoContext, type ControlSchema } from "./demo-provider";

// Input type: what the user passes to useDemoControls
type ControlInput =
  | { options: readonly string[]; default: string; label?: string }
  | { default: boolean; label?: string };

// Infer the value type from a control input definition
type ControlValue<T extends ControlInput> = T extends {
  options: readonly string[];
}
  ? T["options"][number]
  : boolean;

/**
 * Declares demo controls and returns current values. The schema is registered
 * with DemoPreview's context so controls render automatically in the control bar.
 *
 * Pass `{ options, default }` for select controls, or `{ default: true/false }` for toggles.
 *
 * @returns Current control values keyed by schema field name.
 */
export function useDemoControls<T extends Record<string, ControlInput>>(
  defs: T,
): { [K in keyof T]: ControlValue<T[K]> } {
  const ctx = useDemoContext();
  const registered = useRef(false);

  useEffect(() => {
    if (!registered.current) {
      const schema: ControlSchema = {};
      for (const [key, def] of Object.entries(defs)) {
        if (typeof def.default === "boolean") {
          schema[key] = {
            type: "boolean",
            default: def.default,
            label: def.label,
          };
        } else {
          schema[key] = {
            type: "select",
            options: (def as { options: readonly string[] }).options,
            default: def.default,
            label: def.label,
          };
        }
      }
      ctx.registerControls(schema);
      registered.current = true;
    }
    // Register once on mount — schema object is stable by convention
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = {} as Record<string, string | boolean>;
  for (const [key, def] of Object.entries(defs)) {
    result[key] = ctx.controlValues[key] ?? def.default;
  }

  return result as { [K in keyof T]: ControlValue<T[K]> };
}

const switchTrack = cva(
  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
  {
    variants: {
      checked: {
        true: "bg-fd-primary",
        false: "bg-fd-border",
      },
    },
  },
);

const switchThumb = cva(
  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-0.5",
  {
    variants: {
      checked: {
        true: "translate-x-[1.125rem]",
        false: "translate-x-0.5",
      },
    },
  },
);

const selectOption = cva(
  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      active: {
        true: "bg-fd-primary text-fd-primary-foreground",
        false:
          "bg-fd-muted text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground",
      },
    },
  },
);

function BooleanControl({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2"
    >
      <span className={switchTrack({ checked })}>
        <span className={switchThumb({ checked })} />
      </span>
      <span className="text-xs text-fd-muted-foreground">{label}</span>
    </button>
  );
}

function SelectControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-fd-muted-foreground">{label}:</span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={selectOption({ active: value === option })}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/**
 * Renders the control bar UI from registered schema. Returns null when no
 * controls have been registered.
 *
 * @returns Control bar element or null.
 */
export function DemoControlBar() {
  const { controlSchema, controlValues, setControlValue } = useDemoContext();
  if (!controlSchema) return null;

  const entries = Object.entries(controlSchema);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-fd-border bg-fd-muted/50 px-6 py-3">
      {entries.map(([key, def]) => {
        const label = def.label ?? key;

        if (def.type === "boolean") {
          return (
            <BooleanControl
              key={key}
              label={label}
              checked={controlValues[key] === true}
              onChange={(value) => setControlValue(key, value)}
            />
          );
        }

        return (
          <SelectControl
            key={key}
            label={label}
            options={def.options}
            value={controlValues[key] as string}
            onChange={(value) => setControlValue(key, value)}
          />
        );
      })}
    </div>
  );
}
