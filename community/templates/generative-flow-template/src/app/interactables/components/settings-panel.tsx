"use client";

import { withInteractable } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

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

function SettingsPanelBase(props: SettingsProps) {
  const [settings, setSettings] = useState<SettingsProps>(props);
  const [emailError, setEmailError] = useState<string>("");
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());
  const prevPropsRef = useRef<SettingsProps>(props);

  // Update local state when props change from Tambo
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    console.log("Props effect triggered");
    console.log("Previous props:", prevProps);
    console.log("Current props:", props);

    // Find which fields changed
    const changedFields = new Set<string>();

    // Check each field for changes
    if (props.name !== prevProps.name) {
      changedFields.add("name");
      console.log("Name changed:", prevProps.name, "->", props.name);
    }
    if (props.email !== prevProps.email) {
      changedFields.add("email");
      console.log("Email changed:", prevProps.email, "->", props.email);
    }
    if (props.theme !== prevProps.theme) {
      changedFields.add("theme");
      console.log("Theme changed:", prevProps.theme, "->", props.theme);
    }
    if (props.language !== prevProps.language) {
      changedFields.add("language");
      console.log(
        "Language changed:",
        prevProps.language,
        "->",
        props.language,
      );
    }

    // Check notification fields
    if (props.notifications.email !== prevProps.notifications.email) {
      changedFields.add("notifications.email");
    }
    if (props.notifications.push !== prevProps.notifications.push) {
      changedFields.add("notifications.push");
    }
    if (props.notifications.sms !== prevProps.notifications.sms) {
      changedFields.add("notifications.sms");
    }

    // Check privacy fields
    if (props.privacy.shareAnalytics !== prevProps.privacy.shareAnalytics) {
      changedFields.add("privacy.shareAnalytics");
    }
    if (
      props.privacy.personalizationEnabled !==
      prevProps.privacy.personalizationEnabled
    ) {
      changedFields.add("privacy.personalizationEnabled");
    }

    console.log("Changed fields:", Array.from(changedFields));

    // Update state and ref
    setSettings(props);
    prevPropsRef.current = props;

    if (changedFields.size > 0) {
      setUpdatedFields(changedFields);
      // Clear highlights after animation
      const timer = setTimeout(() => {
        setUpdatedFields(new Set());
        console.log("Cleared animation fields");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [props]);

  const handleChange = (updates: Partial<SettingsProps>) => {
    setSettings((prev) => ({ ...prev, ...updates }));

    // Validate email if it's being updated
    if ("email" in updates) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email as string)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h2>

      {/* Personal Information */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleChange({ name: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  updatedFields.has("name") ? "animate-pulse" : ""
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange({ email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  emailError ? "border-red-500" : "border-gray-300"
                } ${updatedFields.has("email") ? "animate-pulse" : ""}`}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Notifications
          </h3>
          <div className="space-y-3">
            <label
              className={`flex items-center ${
                updatedFields.has("notifications.email") ? "animate-pulse" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) =>
                  handleChange({
                    notifications: {
                      ...settings.notifications,
                      email: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Email notifications
              </span>
            </label>
            <label
              className={`flex items-center ${
                updatedFields.has("notifications.push") ? "animate-pulse" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={settings.notifications.push}
                onChange={(e) =>
                  handleChange({
                    notifications: {
                      ...settings.notifications,
                      push: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Push notifications
              </span>
            </label>
            <label
              className={`flex items-center ${
                updatedFields.has("notifications.sms") ? "animate-pulse" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={settings.notifications.sms}
                onChange={(e) =>
                  handleChange({
                    notifications: {
                      ...settings.notifications,
                      sms: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                SMS notifications
              </span>
            </label>
          </div>
        </div>

        {/* Appearance */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) =>
                  handleChange({
                    theme: e.target.value as "light" | "dark" | "system",
                  })
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  updatedFields.has("theme") ? "animate-pulse" : ""
                }`}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) =>
                  handleChange({
                    language: e.target.value as "en" | "es" | "fr" | "de",
                  })
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  updatedFields.has("language") ? "animate-pulse" : ""
                }`}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy</h3>
          <div className="space-y-3">
            <label
              className={`flex items-center ${
                updatedFields.has("privacy.shareAnalytics")
                  ? "animate-pulse"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                checked={settings.privacy.shareAnalytics}
                onChange={(e) =>
                  handleChange({
                    privacy: {
                      ...settings.privacy,
                      shareAnalytics: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Share usage analytics
              </span>
            </label>
            <label
              className={`flex items-center ${
                updatedFields.has("privacy.personalizationEnabled")
                  ? "animate-pulse"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                checked={settings.privacy.personalizationEnabled}
                onChange={(e) =>
                  handleChange({
                    privacy: {
                      ...settings.privacy,
                      personalizationEnabled: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Enable personalization
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Current Settings Display */}
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Current Settings (JSON)
        </h4>
        <pre className="text-xs text-gray-600 overflow-auto">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// Create the interactable component
const InteractableSettingsPanel = withInteractable(SettingsPanelBase, {
  componentName: "SettingsForm",
  description:
    "User settings form with personal info, notifications, and preferences",
  propsSchema: settingsSchema,
});

// Export a wrapper that provides default props and handles state
export function SettingsPanel() {
  return (
    <InteractableSettingsPanel
      name="Alice Johnson"
      email="alice@example.com"
      notifications={{
        email: true,
        push: false,
        sms: true,
      }}
      theme="light"
      language="en"
      privacy={{
        shareAnalytics: false,
        personalizationEnabled: true,
      }}
      onPropsUpdate={(newProps) => {
        console.log("Settings updated from Tambo:", newProps);
      }}
    />
  );
}
