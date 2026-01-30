import { withInteractable } from "@tambo-ai/react";
import { useEffect, useState } from "react";
import { z } from "zod";

/* ----------------------------- Schema ----------------------------- */

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

/* ----------------------- Base Component ---------------------------- */

function SettingsPanelBase(props: SettingsProps) {
  // Local editable state (initialized once)
  const [settings, setSettings] = useState<SettingsProps>(props);
  const [emailError, setEmailError] = useState<string>("");
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());

  /* ---------------------- Side Effects ---------------------- */
  // Only responsible for clearing highlight animations
  useEffect(() => {
    if (updatedFields.size === 0) return;

    const timer = setTimeout(() => {
      setUpdatedFields(new Set());
    }, 1000);

    return () => clearTimeout(timer);
  }, [updatedFields]);

  /* ----------------------- Handlers ------------------------- */

  const handleChange = (updates: Partial<SettingsProps>) => {
    setSettings((prev) => ({ ...prev, ...updates }));

    if ("email" in updates) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailError(
        emailRegex.test(updates.email ?? "")
          ? ""
          : "Please enter a valid email address",
      );
    }
  };

  /* ------------------------- UI ----------------------------- */

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-6">Settings</h2>

      {/* Personal Info */}
      <section className="space-y-4 border-b pb-6">
        <h3 className="font-medium text-lg">Personal Information</h3>

        <input
          className={`input ${updatedFields.has("name") ? "animate-pulse" : ""}`}
          value={settings.name}
          onChange={(e) => handleChange({ name: e.target.value })}
        />

        <input
          className={`input ${
            emailError ? "border-red-500" : ""
          } ${updatedFields.has("email") ? "animate-pulse" : ""}`}
          value={settings.email}
          onChange={(e) => handleChange({ email: e.target.value })}
        />

        {emailError && <p className="text-red-600 text-sm">{emailError}</p>}
      </section>

      {/* Notifications */}
      <section className="space-y-3 border-b py-6">
        <h3 className="font-medium text-lg">Notifications</h3>

        {(["email", "push", "sms"] as const).map((key) => (
          <label
            key={key}
            className={`flex items-center gap-2 ${
              updatedFields.has(`notifications.${key}`)
                ? "animate-pulse"
                : ""
            }`}
          >
            <input
              type="checkbox"
              checked={settings.notifications[key]}
              onChange={(e) =>
                handleChange({
                  notifications: {
                    ...settings.notifications,
                    [key]: e.target.checked,
                  },
                })
              }
            />
            {key}
          </label>
        ))}
      </section>

      {/* Appearance */}
      <section className="space-y-4 border-b py-6">
        <h3 className="font-medium text-lg">Appearance</h3>

        <select
          value={settings.theme}
          onChange={(e) =>
            handleChange({
              theme: e.target.value as SettingsProps["theme"],
            })
          }
          className={updatedFields.has("theme") ? "animate-pulse" : ""}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>

        <select
          value={settings.language}
          onChange={(e) =>
            handleChange({
              language: e.target.value as SettingsProps["language"],
            })
          }
          className={updatedFields.has("language") ? "animate-pulse" : ""}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </section>

      {/* Privacy */}
      <section className="space-y-3 py-6">
        <h3 className="font-medium text-lg">Privacy</h3>

        {(["shareAnalytics", "personalizationEnabled"] as const).map((key) => (
          <label
            key={key}
            className={`flex items-center gap-2 ${
              updatedFields.has(`privacy.${key}`) ? "animate-pulse" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={settings.privacy[key]}
              onChange={(e) =>
                handleChange({
                  privacy: {
                    ...settings.privacy,
                    [key]: e.target.checked,
                  },
                })
              }
            />
            {key}
          </label>
        ))}
      </section>

      {/* Debug */}
      <pre className="mt-6 bg-gray-50 p-4 text-xs">
        {JSON.stringify(settings, null, 2)}
      </pre>
    </div>
  );
}

/* -------------------- Interactable Wrapper -------------------- */

const InteractableSettingsPanel = withInteractable(SettingsPanelBase, {
  componentName: "SettingsForm",
  description:
    "User settings form with personal info, notifications, and preferences",
  propsSchema: settingsSchema,
});

/* ----------------------- Exported Demo ------------------------ */

export function SettingsPanel() {
  return (
    <InteractableSettingsPanel
      name="Alice Johnson"
      email="alice@example.com"
      notifications={{ email: true, push: false, sms: true }}
      theme="light"
      language="en"
      privacy={{ shareAnalytics: false, personalizationEnabled: true }}
      onPropsUpdate={(newProps) => {
        // ✅ Correct place to sync props → local state
        console.log("Updated from Tambo:", newProps);
      }}
    />
  );
}
