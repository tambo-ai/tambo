"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { EditWithTamboButton } from "@/components/ui/tambo/edit-with-tambo-button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { OAuthValidationMode } from "@tambo-ai-cloud/core";
import type { Suggestion } from "@tambo-ai/react";
import { withInteractable } from "@tambo-ai/react";
import { motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  Database,
  Loader2,
  Shield,
} from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import {
  SiAuth0,
  SiClerk,
  SiGithub,
  SiGoogle,
  SiOkta,
  SiSupabase,
} from "react-icons/si";
import { z } from "zod/v3";

const COMPONENT_NAME = "OAuthTokenValidation";

const oauthSettingsSuggestions: Suggestion[] = [
  {
    id: "fetch-oauth-settings",
    title: "Fetch OAuth Settings",
    detailedSuggestion: "Fetch the OAuth settings for this project",
    messageId: "fetch-oauth-settings",
  },
  {
    id: "update-oauth-settings",
    title: "Update OAuth Settings",
    detailedSuggestion: "Update the OAuth settings for this project",
    messageId: "update-oauth-settings",
  },
  {
    id: "make-token-required-true",
    title: "Make Token Required True",
    detailedSuggestion: "Make the token required for this project to be true",
    messageId: "make-token-required-true",
  },
];

export const InteractableOAuthSettingsProps = z.object({
  projectId: z.string().describe("The unique identifier for the project."),
  isTokenRequired: z
    .boolean()
    .optional()
    .describe(
      "Current token required setting. When true, all API requests must include a valid OAuth bearer token.",
    ),
  setValidationMode: z
    .nativeEnum(OAuthValidationMode)
    .optional()
    .describe(
      "When set, changes the OAuth validation mode to the specified value (NONE, SYMMETRIC, ASYMMETRIC_AUTO, or ASYMMETRIC_MANUAL).",
    ),
  setTokenRequired: z
    .boolean()
    .optional()
    .describe("When set, toggles the token required setting to this value."),
  setSecretKeyValue: z
    .string()
    .optional()
    .describe(
      "When set, updates the symmetric secret key to this value. Only applicable when validation mode is SYMMETRIC.",
    ),
  setPublicKeyValue: z
    .string()
    .optional()
    .describe(
      "When set, updates the public key to this value. Only applicable when validation mode is ASYMMETRIC_MANUAL.",
    ),
  triggerSave: z
    .boolean()
    .optional()
    .describe(
      "When true, triggers saving the OAuth settings with current values.",
    ),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe(
      "Optional callback function triggered when OAuth settings are successfully updated.",
    ),
});

interface OAuthSettingsProps {
  projectId: string;
  isTokenRequired?: boolean;
  setValidationMode?: OAuthValidationMode;
  setTokenRequired?: boolean;
  setSecretKeyValue?: string;
  setPublicKeyValue?: string;
  triggerSave?: boolean;
  onEdited?: () => void;
}

// OAuth provider presets
const OAUTH_PRESETS = [
  { name: "Google", mode: OAuthValidationMode.ASYMMETRIC_AUTO, icon: SiGoogle },
  { name: "GitHub", mode: OAuthValidationMode.ASYMMETRIC_AUTO, icon: SiGithub },
  {
    name: "Microsoft",
    mode: OAuthValidationMode.ASYMMETRIC_AUTO,
    icon: Building2,
  },
  {
    name: "Login.gov",
    mode: OAuthValidationMode.ASYMMETRIC_AUTO,
    icon: Shield,
  },
  { name: "Auth0", mode: OAuthValidationMode.ASYMMETRIC_AUTO, icon: SiAuth0 },
  { name: "Clerk", mode: OAuthValidationMode.ASYMMETRIC_AUTO, icon: SiClerk },
  { name: "Supabase Auth", mode: OAuthValidationMode.NONE, icon: SiSupabase },
  {
    name: "Supabase Auth (beta API Keys)",
    mode: OAuthValidationMode.ASYMMETRIC_AUTO,
    icon: SiSupabase,
  },
  { name: "Neon", mode: OAuthValidationMode.ASYMMETRIC_AUTO, icon: Database },
  { name: "Okta", mode: OAuthValidationMode.ASYMMETRIC_AUTO, icon: SiOkta },
  {
    name: "BetterAuth",
    mode: OAuthValidationMode.ASYMMETRIC_AUTO,
    icon: Shield,
  },
] as const;

export function OAuthSettings({
  projectId,
  isTokenRequired: initialIsTokenRequired,
  setValidationMode,
  setTokenRequired,
  setSecretKeyValue,
  setPublicKeyValue,
  triggerSave,
  onEdited,
}: OAuthSettingsProps) {
  const modeNoneId = useId();
  const modeSymmetricId = useId();
  const secretKeyId = useId();
  const modeAsymmetricAutoId = useId();
  const modeAsymmetricManualId = useId();
  const publicKeyId = useId();
  const { toast } = useToast();

  // State management
  const [selectedMode, setSelectedMode] = useState<OAuthValidationMode>(
    OAuthValidationMode.NONE,
  );
  const [secretKey, setSecretKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [isTokenRequiredState, setIsTokenRequiredState] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // API queries and mutations
  const {
    data: oauthSettings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
  } = api.project.getOAuthValidationSettings.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  const { mutateAsync: updateSettings, isPending: isUpdating } =
    api.project.updateOAuthValidationSettings.useMutation();

  const handleModeChange = useCallback((mode: OAuthValidationMode) => {
    setSelectedMode(mode);
    // Clear keys when switching modes
    if (mode !== OAuthValidationMode.SYMMETRIC) {
      setSecretKey("");
    }
    if (mode !== OAuthValidationMode.ASYMMETRIC_MANUAL) {
      setPublicKey("");
    }
  }, []);

  // Initialize form with current settings
  useEffect(() => {
    if (oauthSettings) {
      setSelectedMode(oauthSettings.mode);
      setPublicKey(oauthSettings.publicKey || "");
      setSecretKey("");
      setHasUnsavedChanges(false);
    }
  }, [oauthSettings]);

  // Initialize token required state from prop
  useEffect(() => {
    if (initialIsTokenRequired !== undefined) {
      setIsTokenRequiredState(initialIsTokenRequired);
    }
  }, [initialIsTokenRequired]);

  // When Tambo sends setValidationMode, change the mode
  useEffect(() => {
    if (setValidationMode !== undefined) {
      handleModeChange(setValidationMode);
    }
  }, [setValidationMode, handleModeChange]);

  // When Tambo sends setTokenRequired, update the state
  useEffect(() => {
    if (setTokenRequired !== undefined) {
      setIsTokenRequiredState(setTokenRequired);
    }
  }, [setTokenRequired]);

  // When Tambo sends setSecretKeyValue, update the secret key
  useEffect(() => {
    if (setSecretKeyValue) {
      setSecretKey(setSecretKeyValue);
    }
  }, [setSecretKeyValue]);

  // When Tambo sends setPublicKeyValue, update the public key
  useEffect(() => {
    if (setPublicKeyValue) {
      setPublicKey(setPublicKeyValue);
    }
  }, [setPublicKeyValue]);

  // When Tambo sends triggerSave, save the settings
  useEffect(() => {
    if (triggerSave === true) {
      handleSave().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSave]);

  // Track changes
  useEffect(() => {
    if (!oauthSettings) return;

    const hasOAuthChanges =
      selectedMode !== oauthSettings.mode ||
      (selectedMode === OAuthValidationMode.ASYMMETRIC_MANUAL &&
        publicKey !== (oauthSettings.publicKey || "")) ||
      (selectedMode === OAuthValidationMode.SYMMETRIC && secretKey !== "");

    const hasTokenRequiredChanges =
      isTokenRequiredState !== (initialIsTokenRequired ?? false);

    setHasUnsavedChanges(hasOAuthChanges || hasTokenRequiredChanges);
  }, [
    selectedMode,
    publicKey,
    secretKey,
    isTokenRequiredState,
    oauthSettings,
    initialIsTokenRequired,
  ]);

  const handleSave = useCallback(async () => {
    if (!projectId) return;

    try {
      await updateSettings({
        projectId,
        mode: selectedMode,
        secretKey:
          selectedMode === OAuthValidationMode.SYMMETRIC
            ? secretKey
            : undefined,
        publicKey:
          selectedMode === OAuthValidationMode.ASYMMETRIC_MANUAL
            ? publicKey
            : undefined,
        isTokenRequired: isTokenRequiredState,
      });

      toast({
        title: "Success",
        description: "OAuth validation settings updated successfully",
      });

      setSecretKey("");
      setHasUnsavedChanges(false);
      await refetchSettings();
      onEdited?.();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to update OAuth validation settings",
        variant: "destructive",
      });
    }
  }, [
    projectId,
    selectedMode,
    secretKey,
    publicKey,
    isTokenRequiredState,
    updateSettings,
    toast,
    refetchSettings,
    onEdited,
  ]);

  if (isLoadingSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OAuth Token Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          OAuth Token Validation
          <EditWithTamboButton description="Manage OAuth token validation settings for this project." />
        </CardTitle>
        <p className="text-sm font-sans text-foreground">
          Configure how OAuth bearer tokens are validated for your
          project&apos;s API endpoints.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Required */}
        <div className="flex flex-col gap-2">
          <Label className="text-base font-medium">Token Required</Label>
          <Switch
            checked={isTokenRequiredState}
            onCheckedChange={setIsTokenRequiredState}
          />
          <p className="text-sm text-muted-foreground">
            When enabled, all API requests must include a valid OAuth bearer
            token. When disabled, requests can proceed without authentication.
          </p>
        </div>
        {/* Validation Mode Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between w-full">
            <Label className="text-base font-medium">Validation Mode</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Apply a preset
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {OAUTH_PRESETS.map((preset) => (
                  <DropdownMenuItem
                    key={preset.name}
                    onClick={() => handleModeChange(preset.mode)}
                    className="cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      <preset.icon className="h-4 w-4" />
                      {preset.name}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <RadioGroup
            value={selectedMode}
            onValueChange={(value) =>
              handleModeChange(value as OAuthValidationMode)
            }
            className="space-y-3"
          >
            {/* NONE */}
            <label
              htmlFor={modeNoneId}
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem
                value={OAuthValidationMode.NONE}
                id={modeNoneId}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-md">None</div>
                <div className="text-xs text-foreground">
                  Accept tokens as-is without validation. Useful when validation
                  is handled externally.
                </div>
              </div>
            </label>

            {/* SYMMETRIC */}
            <label
              htmlFor={modeSymmetricId}
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem
                value={OAuthValidationMode.SYMMETRIC}
                id={modeSymmetricId}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-md">Symmetric Key (HS256)</div>
                <div className="text-xs text-foreground">
                  Validate tokens using a shared secret key. Requires storing
                  the secret key securely.
                </div>
                {selectedMode === OAuthValidationMode.SYMMETRIC && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    <Label htmlFor={secretKeyId} className="text-sm">
                      Secret Key
                    </Label>
                    <Input
                      id={secretKeyId}
                      type="password"
                      placeholder="Enter your shared secret key"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <p className="text-xs text-muted-foreground">
                      {oauthSettings?.hasSecretKey
                        ? "A secret key is currently stored. Enter a new key to replace it."
                        : "This key will be encrypted and stored securely."}
                    </p>
                  </motion.div>
                )}
              </div>
            </label>

            {/* ASYMMETRIC_AUTO */}
            <label
              htmlFor={modeAsymmetricAutoId}
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem
                value={OAuthValidationMode.ASYMMETRIC_AUTO}
                id={modeAsymmetricAutoId}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-md">
                  Asymmetric Auto (OpenID Connect)
                </div>
                <div className="text-xs text-foreground">
                  Automatically fetch public keys from the OAuth provider&apos;s
                  OpenID Connect discovery endpoint.
                </div>
              </div>
            </label>

            {/* ASYMMETRIC_MANUAL */}
            <label
              htmlFor={modeAsymmetricManualId}
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem
                value={OAuthValidationMode.ASYMMETRIC_MANUAL}
                id={modeAsymmetricManualId}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-md">Asymmetric Manual</div>
                <div className="text-xs text-foreground">
                  Validate tokens using a manually provided public key (RS256,
                  ES256, etc.).
                </div>
                {selectedMode === OAuthValidationMode.ASYMMETRIC_MANUAL && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    <Label htmlFor={publicKeyId} className="text-sm">
                      Public Key
                    </Label>
                    <Textarea
                      id={publicKeyId}
                      placeholder={`-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----`}
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the public key in PEM format. This will be used to
                      verify JWT signatures.
                    </p>
                  </motion.div>
                )}
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>Save</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export const InteractableOAuthSettings = withInteractable(OAuthSettings, {
  componentName: COMPONENT_NAME,
  description:
    "Manages OAuth token validation settings for a project. Configure how OAuth bearer tokens are validated, including validation mode (None, Symmetric, Asymmetric Auto, Asymmetric Manual), token required setting, secret keys, and public keys. Users can view current settings and update them.",
  propsSchema: InteractableOAuthSettingsProps,
});
