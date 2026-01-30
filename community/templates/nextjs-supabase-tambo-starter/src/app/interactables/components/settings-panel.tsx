"use client";

import { withInteractable } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

/* ---------------- Schema (UNCHANGED) ---------------- */

const settingsSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["en", "es", "fr", "de"]),
  privacy: z.object({
    shareAnalytics: z.boolean(),
    personalizationEnabled: z.boolean(),
  }),
});

type SettingsProps = z.infer<typeof settingsSchema>;

/* ---------------- Component ---------------- */

function SettingsPanelBase(props: SettingsProps) {
  const [settings, setSettings] = useState<SettingsProps>(props);
  const [emailError, setEmailError] = useState("");
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());
  const prevPropsRef = useRef(props);

  useEffect(() => {
    const prev = prevPropsRef.current;
    const changed = new Set<string>();

    if (props.name !== prev.name) changed.add("name");
    if (props.email !== prev.email) changed.add("email");
    if (props.theme !== prev.theme) changed.add("theme");
    if (props.language !== prev.language) changed.add("language");

    if (props.notifications.email !== prev.notifications.email)
      changed.add("notifications.email");
    if (props.notifications.push !== prev.notifications.push)
      changed.add("notifications.push");
    if (props.notifications.sms !== prev.notifications.sms)
      changed.add("notifications.sms");

    if (props.privacy.shareAnalytics !== prev.privacy.shareAnalytics)
      changed.add("privacy.shareAnalytics");
    if (
      props.privacy.personalizationEnabled !==
      prev.privacy.personalizationEnabled
    )
      changed.add("privacy.personalizationEnabled");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setSettings(props);
    prevPropsRef.current = props;

    if (changed.size) {
      setUpdatedFields(changed);
      const t = setTimeout(() => setUpdatedFields(new Set()), 700);
      return () => clearTimeout(t);
    }
  }, [props]);

  const handleChange = (updates: Partial<SettingsProps>) => {
    setSettings((p) => ({ ...p, ...updates }));
    if ("email" in updates) {
      setEmailError(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email as string)
          ? ""
          : "INVALID EMAIL FORMAT",
      );
    }
  };

  const pulse = (key: string) =>
    updatedFields.has(key)
      ? "border-orange-500"
      : "border-[#24262b]";

  return (
    <div className="max-w-3xl border border-[#24262b] bg-[#0f1115] text-[#d1d5db]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#24262b] bg-[#0c0e12] px-6 py-4">
        <h2 className="text-sm tracking-[0.3em] text-orange-500 font-semibold">
          USER SETTINGS
        </h2>
        <span className="text-xs text-gray-500">SECURE CHANNEL</span>
      </div>

      {/* Content */}
      <div className="p-6 space-y-10 text-sm">

        {/* PERSONAL */}
        <section>
          <h3 className="mb-4 text-xs tracking-widest text-gray-400">
            PERSONAL INFORMATION
          </h3>

          <div className="grid gap-4">
            <input
              value={settings.name}
              onChange={(e) => handleChange({ name: e.target.value })}
              placeholder="NAME"
              className={`bg-[#0b0d10] px-4 py-2 border ${pulse(
                "name",
              )} focus:outline-none`}
            />

            <div>
              <input
                value={settings.email}
                onChange={(e) => handleChange({ email: e.target.value })}
                placeholder="EMAIL"
                className={`w-full bg-[#0b0d10] px-4 py-2 border ${
                  emailError ? "border-red-600" : pulse("email")
                } focus:outline-none`}
              />
              {emailError && (
                <p className="mt-1 text-[11px] text-red-500">
                  {emailError}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section>
          <h3 className="mb-4 text-xs tracking-widest text-gray-400">
            NOTIFICATION CHANNELS
          </h3>

          <div className="space-y-2">
            {(["email", "push", "sms"] as const).map((k) => (
              <label
                key={k}
                className={`flex items-center justify-between px-4 py-2 border bg-[#0b0d10] ${pulse(
                  `notifications.${k}`,
                )}`}
              >
                <span className="uppercase tracking-wide text-xs">
                  {k} alerts
                </span>
                <input
                  type="checkbox"
                  checked={settings.notifications[k]}
                  onChange={(e) =>
                    handleChange({
                      notifications: {
                        ...settings.notifications,
                        [k]: e.target.checked,
                      },
                    })
                  }
                  className="accent-orange-500"
                />
              </label>
            ))}
          </div>
        </section>

        {/* APPEARANCE */}
        <section>
          <h3 className="mb-4 text-xs tracking-widest text-gray-400">
            APPEARANCE
          </h3>

          <div className="grid gap-3">
            <select
              value={settings.theme}
              onChange={(e) =>
                handleChange({ theme: e.target.value as any })
              }
              className={`bg-[#0b0d10] px-4 py-2 border ${pulse(
                "theme",
              )}`}
            >
              <option value="light">LIGHT</option>
              <option value="dark">DARK</option>
              <option value="system">SYSTEM</option>
            </select>

            <select
              value={settings.language}
              onChange={(e) =>
                handleChange({ language: e.target.value as any })
              }
              className={`bg-[#0b0d10] px-4 py-2 border ${pulse(
                "language",
              )}`}
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
              <option value="de">DE</option>
            </select>
          </div>
        </section>

        {/* PRIVACY */}
        <section>
          <h3 className="mb-4 text-xs tracking-widest text-gray-400">
            PRIVACY CONTROLS
          </h3>

          <div className="space-y-2">
            {([
              ["shareAnalytics", "SHARE ANALYTICS"],
              ["personalizationEnabled", "PERSONALIZATION"],
            ] as const).map(([k, label]) => (
              <label
                key={k}
                className={`flex items-center justify-between px-4 py-2 border bg-[#0b0d10] ${pulse(
                  `privacy.${k}`,
                )}`}
              >
                <span className="text-xs tracking-wide">{label}</span>
                <input
                  type="checkbox"
                  checked={settings.privacy[k]}
                  onChange={(e) =>
                    handleChange({
                      privacy: {
                        ...settings.privacy,
                        [k]: e.target.checked,
                      },
                    })
                  }
                  className="accent-orange-500"
                />
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* DEBUG */}
      <div className="border-t border-[#24262b] bg-[#0c0e12] p-4">
        <p className="mb-2 text-[11px] tracking-widest text-gray-500">
          DEBUG STATE
        </p>
        <pre className="text-xs text-gray-400 overflow-auto">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  );
}

/* ---------------- Interactable Wrapper ---------------- */

const InteractableSettingsPanel = withInteractable(SettingsPanelBase, {
  componentName: "SettingsForm",
  description: "Tactical user settings panel",
  propsSchema: settingsSchema,
});

export function SettingsPanel() {
  return (
    <InteractableSettingsPanel
      name="Alice Johnson"
      email="alice@example.com"
      notifications={{ email: true, push: false, sms: true }}
      theme="light"
      language="en"
      privacy={{
        shareAnalytics: false,
        personalizationEnabled: true,
      }}
      onPropsUpdate={(p) =>
        console.log("SETTINGS UPDATED:", p)
      }
    />
  );
}
