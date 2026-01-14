import { CopyButton } from "@/components/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isLikelyIsoDateTimeString } from "@/lib/is-likely-iso-datetime";
import { type RouterOutputs, api } from "@/trpc/react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AiProviderType, DEFAULT_OPENAI_MODEL } from "@tambo-ai-cloud/core";
import { z } from "zod/v3";
import { FREE_MESSAGE_LIMIT } from "./provider-key-section";

export const ProjectInfoSchema = z.object({
  id: z.string().describe("The unique identifier for the project."),
  name: z.string().describe("The human-readable name of the project."),
  userId: z.string().describe("The user ID of the project owner."),
  createdAt: z.string().describe("The creation date of the project."),
  isTokenRequired: z
    .boolean()
    .describe("Whether authentication tokens are required for this project."),
});

export const ProjectInfoProps = z.object({
  compact: z
    .boolean()
    .optional()
    .describe(
      "Whether to use compact mode. Always use compact mode. Always set this to true first before doing anything else.",
    ),
  project: ProjectInfoSchema.optional().describe("The project to display."),
  createdAt: z
    .string()
    .datetime()
    .optional()
    .describe("The ISO-8601 creation date of the project."),
  isLoading: z.boolean().optional().describe("Whether the project is loading."),
});

interface ProjectInfoProps {
  project?: RouterOutputs["project"]["getUserProjects"][number];
  /** ISO-8601 datetime string (e.g. from `Date.prototype.toISOString()`). */
  createdAt?: string;
  isLoading?: boolean;
  compact?: boolean;
}

interface ProjectInfoLoadedProps {
  project: NonNullable<ProjectInfoProps["project"]>;
  createdAt?: string;
  compact: boolean;
}

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export function ProjectInfo({
  project,
  createdAt,
  compact = false,
}: ProjectInfoProps) {
  if (!project) {
    return (
      <Card
        className={`border rounded-md overflow-hidden ${compact ? "rounded-lg" : ""}`}
      >
        <CardContent className={compact ? "p-2" : "p-4"}>
          <p className="text-sm text-muted-foreground">No project found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ProjectInfoLoaded
      project={project}
      createdAt={createdAt}
      compact={compact}
    />
  );
}

function ProjectInfoLoaded({
  project,
  createdAt,
  compact,
}: ProjectInfoLoadedProps) {
  // Fetch message usage data
  const {
    data: messageUsage,
    isLoading: isLoadingUsage,
    isError: isUsageError,
  } = api.project.getProjectMessageUsage.useQuery({ projectId: project.id });

  const {
    data: storedApiKeys,
    isLoading: isLoadingKeys,
    isFetching: isFetchingKeys,
    isError: isKeysError,
  } = api.project.getProviderKeys.useQuery(project.id);

  // Calculate remaining messages
  const messageCount = messageUsage?.messageCount;
  const remainingMessages =
    typeof messageCount === "number"
      ? Math.max(0, FREE_MESSAGE_LIMIT - messageCount)
      : null;
  const isLowMessages = remainingMessages !== null && remainingMessages < 50;

  const isUsageUnavailable =
    isLoadingUsage || isUsageError || remainingMessages === null;

  const starterQuotaCopy = isUsageUnavailable
    ? "Starter LLM usage unavailable — bring your own key to keep going"
    : `${remainingMessages} starter LLM calls left — bring your own key to keep going`;

  const hasProviderKey = (storedApiKeys?.length ?? 0) > 0;
  const isKeyStatusUnknown = isLoadingKeys || isFetchingKeys || isKeysError;
  const shouldShowStarterQuota = !hasProviderKey && !isKeyStatusUnknown;

  const providerType = project.providerType;

  const llmProvider = project.defaultLlmProviderName || "openai";
  const llmModel = (() => {
    if (llmProvider === "openai-compatible") {
      return project.customLlmModelName || "Custom model";
    }

    if (llmProvider === "openai" && !project.defaultLlmModelName) {
      return DEFAULT_OPENAI_MODEL;
    }

    if (!project.defaultLlmModelName) {
      return "Using provider default";
    }

    return project.defaultLlmModelName;
  })();

  const providerModelLabel =
    providerType === AiProviderType.AGENT
      ? "Agent mode"
      : `${llmProvider} • ${llmModel}`;

  const keyStatusNote = (() => {
    if (isKeysError) return "Key status unavailable";
    if (isLoadingKeys || isFetchingKeys) return "Checking key status...";
    return null;
  })();

  const settingsHref = `/dashboard/${project.id}/settings?section=llm-providers`;

  // Expects an ISO-8601 datetime string; returns "—" when the input isn't a
  // likely ISO datetime or can't be parsed.
  const formatDate = (isoDateString: string) => {
    if (!isLikelyIsoDateTimeString(isoDateString)) {
      return "—";
    }

    const date = new Date(isoDateString);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    // Intentionally uses the viewer's local time zone (the default).
    return date.toLocaleDateString(undefined, {
      year: compact ? "2-digit" : "numeric",
      month: compact ? "short" : "long",
      day: "numeric",
    });
  };

  // Compact version - to be used in chat with tambo
  if (compact) {
    return (
      <Card className="border-card-background bg-card-background rounded-lg overflow-hidden">
        <CardContent className="p-3 space-y-2">
          {/* Header row with name and ID */}
          <motion.div
            className="flex items-center justify-between gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Link href={`/dashboard/${project.id}`}>
              <h4 className="text-lg font-semibold truncate group inline-flex items-center hover:underline">
                {project.name}
                <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
            </Link>
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono bg-info text-info px-1.5 py-0.5 rounded">
                {project.id}
              </code>
              <CopyButton clipboardValue={project.id} className="h-3 w-3" />
            </div>
          </motion.div>

          {/* Info row with date and messages */}
          <motion.div
            className="flex items-center justify-between text-xs text-muted-foreground"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              {createdAt && <span>{formatDate(createdAt)}</span>}
              <span className="text-muted-foreground/50">•</span>
              <span>Owner: {project.userId?.slice(0, 8) ?? "Unknown"}...</span>
            </div>

            {shouldShowStarterQuota ? (
              <div className="flex items-center gap-2">
                <span
                  className={`font-medium ${isLowMessages ? "text-red-500" : "text-foreground"}`}
                >
                  {starterQuotaCopy}
                </span>
                {isLowMessages && (
                  <Link
                    href={settingsHref}
                    className="text-primary hover:underline font-medium"
                  >
                    Add key
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-foreground">{providerModelLabel}</span>
                <Button
                  asChild
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium text-primary"
                >
                  <Link href={settingsHref}>Change</Link>
                </Button>
                {keyStatusNote && (
                  <span className="text-muted-foreground">
                    ({keyStatusNote})
                  </span>
                )}
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Full version
  return (
    <Card className="border-card-background bg-card-background rounded-3xl overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="text-3xl sm:text-4xl md:text-6xl pb-2">
            {project.name}
          </h4>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <h5 className="text-xs font-medium text-foreground mb-1">
              Project ID
            </h5>
            <div className="flex items-center gap-1">
              <code className="text-xs sm:text-sm font-mono truncate max-w-[150px] sm:max-w-none">
                {project.id}
              </code>
              <CopyButton
                clipboardValue={project.id}
                className="h-4 w-4 sm:h-5 sm:w-5"
              />
            </div>
          </motion.div>

          {createdAt && (
            <div className="sm:border-l border-muted-foreground/20 sm:pl-4">
              <motion.div variants={itemVariants}>
                <h5 className="text-xs font-medium text-foreground mb-1">
                  Created
                </h5>
                <p className="text-xs sm:text-sm">{formatDate(createdAt)}</p>
              </motion.div>
            </div>
          )}

          <div className="sm:border-l border-muted-foreground/20 sm:pl-4">
            <motion.div variants={itemVariants}>
              <h5 className="text-xs font-medium text-foreground mb-1">
                Owner
              </h5>
              <p className="text-xs sm:text-sm truncate">
                {project.userId ?? "Unknown"}
              </p>
            </motion.div>
          </div>

          <div className="sm:border-l border-muted-foreground/20 sm:pl-4">
            <motion.div variants={itemVariants}>
              {shouldShowStarterQuota ? (
                <>
                  <h5 className="text-xs font-medium text-foreground mb-1">
                    Starter LLM calls remaining
                  </h5>
                  <div className="flex items-center gap-4">
                    <p
                      className={`text-sm ${isLowMessages ? "text-red-500 font-medium" : ""}`}
                    >
                      {starterQuotaCopy}
                    </p>
                    <Link
                      href={settingsHref}
                      className="text-xs font-semibold underline"
                    >
                      Add provider key
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-medium text-foreground">
                      Provider • Model
                    </h5>
                    <Button
                      asChild
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs font-semibold text-primary"
                    >
                      <Link href={settingsHref}>Change</Link>
                    </Button>
                  </div>
                  <p className="text-xs sm:text-sm truncate">
                    {providerModelLabel}
                  </p>
                  {keyStatusNote && (
                    <p className="text-xs text-muted-foreground">
                      {keyStatusNote}
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
