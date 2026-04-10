import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { SettingsRow } from "@/components/ui/settings-row";
import {
  AGENT_PROVIDER_REGISTRY,
  AgentProviderType,
} from "@tambo-ai-cloud/core";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useId } from "react";
import { HeadersEditor, type HeaderKV } from "./headers-editor";

export function AgentSettings({
  agentProvider,
  setAgentProvider,
  agentUrl,
  setAgentUrl,
  showValidationErrors,
  agentName,
  setAgentName,
  agentHeaders,
  setAgentHeaders,
}: {
  agentProvider: AgentProviderType;
  setAgentProvider: (agentProvider: AgentProviderType) => void;
  agentUrl: string;
  setAgentUrl: (agentUrl: string) => void;
  showValidationErrors: boolean;
  agentName: string;
  setAgentName: (agentName: string) => void;
  agentHeaders: HeaderKV[];
  setAgentHeaders: (headers: HeaderKV[]) => void;
}) {
  const agentUrlId = useId();
  const agentNameId = useId();
  return (
    <motion.div
      key="agent-settings"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full divide-y divide-border"
    >
      <SettingsRow label="Agent provider" htmlFor="agent-provider">
        <Combobox
          items={AGENT_PROVIDER_REGISTRY.map((provider) => ({
            value: provider.type,
            label: getAgentProviderLabel(provider.type),
            disabled: !provider.isSupported,
          }))}
          value={agentProvider}
          onChange={(newProvider) => {
            setAgentProvider(newProvider);
          }}
          placeholder="Select agent provider..."
          searchPlaceholder="Search agent providers..."
          emptyText="No provider found."
        />
      </SettingsRow>

      <SettingsRow label="Agent URL" htmlFor={agentUrlId}>
        <div className="flex flex-col items-end gap-1">
          <Input
            id={agentUrlId}
            type="url"
            placeholder="e.g., https://my-agent.example.com"
            value={agentUrl}
            onChange={(e) => {
              setAgentUrl(e.target.value);
            }}
            className="w-64"
          />
          {showValidationErrors && !agentUrl.trim() && (
            <p className="text-sm text-destructive">Agent URL is required</p>
          )}
        </div>
      </SettingsRow>

      <div className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Custom headers</p>
            <p className="text-sm text-muted-foreground">
              Optional: Add HTTP headers sent to your Agent URL.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setAgentHeaders([...agentHeaders, { header: "", value: "" }]);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add header
          </Button>
        </div>
        <HeadersEditor
          headers={agentHeaders}
          onSave={(updated) => {
            setAgentHeaders(updated);
          }}
          hideAddButton
        />
      </div>

      <SettingsRow
        label="Agent name"
        description="Optional: Some agent providers require an agent name to route requests correctly."
        htmlFor={agentNameId}
      >
        <Input
          id={agentNameId}
          type="text"
          placeholder="e.g., tambo-agent"
          value={agentName}
          onChange={(e) => {
            setAgentName(e.target.value);
          }}
          className="w-48"
        />
      </SettingsRow>
    </motion.div>
  );
}
function getAgentProviderLabel(type: AgentProviderType): string {
  const info = AGENT_PROVIDER_REGISTRY.find((p) => p.type === type);
  if (!info) return String(type);
  return info.isSupported ? info.name : `${info.name} (coming soon)`;
}
