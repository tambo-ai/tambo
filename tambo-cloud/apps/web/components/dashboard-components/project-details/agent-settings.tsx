import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AGENT_PROVIDER_REGISTRY,
  AgentProviderType,
} from "@tambo-ai-cloud/core";
import { motion } from "framer-motion";
import { HeadersEditor, type HeaderKV } from "./headers-editor";

export function AgentSettings({
  agentProvider,
  setAgentProvider,
  setHasUnsavedChanges,
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
  setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
  agentUrl: string;
  setAgentUrl: (agentUrl: string) => void;
  showValidationErrors: boolean;
  agentName: string;
  setAgentName: (agentName: string) => void;
  agentHeaders: HeaderKV[];
  setAgentHeaders: (headers: HeaderKV[]) => void;
}) {
  return (
    <motion.div
      key="agent-settings"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="space-y-4 rounded-md max-w-xl"
    >
      <div className="space-y-2">
        <Label htmlFor="agent-provider">Agent Provider</Label>
        <Combobox
          items={AGENT_PROVIDER_REGISTRY.map((provider) => ({
            value: provider.type,
            label: getAgentProviderLabel(provider.type),
            disabled: !provider.isSupported,
          }))}
          value={agentProvider}
          onChange={(newProvider) => {
            setAgentProvider(newProvider);
            setHasUnsavedChanges(true);
          }}
          placeholder="Select agent provider..."
          searchPlaceholder="Search agent providers..."
          emptyText="No provider found."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-url">Agent URL</Label>
        <Input
          id="agent-url"
          type="url"
          placeholder="e.g., https://my-agent.example.com"
          value={agentUrl}
          onChange={(e) => {
            setAgentUrl(e.target.value);
            setHasUnsavedChanges(true);
          }}
        />
        {showValidationErrors && !agentUrl.trim() && (
          <p className="text-sm text-destructive">Agent URL is required</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Custom Headers</Label>
        <HeadersEditor
          headers={agentHeaders}
          onSave={(updated) => {
            setAgentHeaders(updated);
            setHasUnsavedChanges(true);
          }}
        />
        <p className="text-xs text-foreground">
          Optional. Add HTTP headers sent to your Agent URL.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-name">Agent Name</Label>
        <Input
          id="agent-name"
          type="text"
          placeholder="e.g., tambo-agent"
          value={agentName}
          onChange={(e) => {
            setAgentName(e.target.value);
            setHasUnsavedChanges(true);
          }}
        />
        <p className="text-xs text-foreground">
          Optional. Some agent providers require an agent name to route requests
          correctly.
        </p>
      </div>
    </motion.div>
  );
}
function getAgentProviderLabel(type: AgentProviderType): string {
  const info = AGENT_PROVIDER_REGISTRY.find((p) => p.type === type);
  if (!info) return String(type);
  return info.isSupported ? info.name : `${info.name} (coming soon)`;
}
