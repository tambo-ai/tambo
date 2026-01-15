import { CopyButton } from "@/components/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { isLikelyIsoDateTimeString } from "@/lib/is-likely-iso-datetime";
import { type RouterOutputs, api } from "@/trpc/react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
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
  // Fetch message usage data
  const { data: messageUsage } = api.project.getProjectMessageUsage.useQuery(
    { projectId: project?.id ?? "" },
    {
      enabled: !!project?.id,
    },
  );

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

  // Calculate remaining messages
  const messageCount = messageUsage?.messageCount ?? 0;
  const remainingMessages = Math.max(0, FREE_MESSAGE_LIMIT - messageCount);
  const isLowMessages = remainingMessages < 50;

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

            <div className="flex items-center gap-2">
              <span
                className={`font-medium ${isLowMessages ? "text-red-500" : "text-foreground"}`}
              >
                {remainingMessages}
              </span>
              {isLowMessages && (
                <Link
                  href={`/dashboard/${project.id}/settings`}
                  className="text-primary hover:underline font-medium"
                >
                  Add API Key
                </Link>
              )}
            </div>
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
              <h5 className="text-xs font-medium text-foreground mb-1">
                Starter LLM calls remaining
              </h5>
              <div className="flex flex-col items-start gap-2">
                <p
                  className={`text-sm ${isLowMessages ? "text-red-500 font-medium" : ""}`}
                >
                  {remainingMessages}
                </p>
                <Link
                  href={`/dashboard/${project.id}/settings`}
                  className="text-xs font-semibold underline"
                >
                  Add API Key
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
