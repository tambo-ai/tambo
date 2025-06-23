import { CopyButton } from "@/components/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { type RouterOutputs, api } from "@/trpc/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { z } from "zod";
import { FREE_MESSAGE_LIMIT } from "./provider-key-section";

export const ProjectInfoSchema = z.object({
  id: z.string().describe("The unique identifier for the project."),
  name: z.string().describe("The human-readable name of the project."),
  userId: z.string().describe("The user ID of the project owner."),
  createdAt: z.string().describe("The creation date of the project."),
});

export const ProjectInfoProps = z.object({
  project: ProjectInfoSchema.optional().describe("The project to display."),
  createdAt: z
    .string()
    .optional()
    .describe("The creation date of the project."),
  isLoading: z.boolean().optional().describe("Whether the project is loading."),
});

interface ProjectInfoProps {
  project?: RouterOutputs["project"]["getUserProjects"][number];
  createdAt?: string;
  isLoading?: boolean;
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

export function ProjectInfo({ project, createdAt }: ProjectInfoProps) {
  // Fetch message usage data
  const { data: messageUsage } = api.project.getProjectMessageUsage.useQuery(
    { projectId: project?.id ?? "" },
    {
      enabled: !!project?.id,
    },
  );

  if (!project) {
    return (
      <Card className="border rounded-md overflow-hidden">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">No project found</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate remaining messages
  const messageCount = messageUsage?.messageCount ?? 0;
  const remainingMessages = Math.max(0, FREE_MESSAGE_LIMIT - messageCount);
  const isLowMessages = remainingMessages < 50;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (_error) {
      return dateString;
    }
  };

  return (
    <Card className="border-card-background bg-card-background rounded-3xl overflow-hidden p-4">
      <CardContent className="p-4 space-y-4">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="text-6xl pb-4">{project.name}</h4>
        </motion.div>

        <motion.div
          className="space-y-3 flex flex-row justify-between grid grid-cols-2 md:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <h5 className="text-xs font-medium text-foreground mb-1">
              Project ID
            </h5>
            <div className="flex items-center gap-1">
              <code className="text-sm font-mono">{project.id}</code>
              <CopyButton clipboardValue={project.id} />
            </div>
          </motion.div>

          {createdAt && (
            <div className="border-l border-muted-foreground/20 pl-4">
              <motion.div variants={itemVariants}>
                <h5 className="text-xs font-medium text-foreground mb-1">
                  Created
                </h5>
                <p className="text-sm">{formatDate(createdAt)}</p>
              </motion.div>
            </div>
          )}

          <div className="border-l border-muted-foreground/20 pl-4">
            <motion.div variants={itemVariants}>
              <h5 className="text-xs font-medium text-foreground mb-1">
                Owner
              </h5>
              <p className="text-sm">{project.userId}</p>
            </motion.div>
          </div>

          <div className="border-l border-muted-foreground/20 pl-4">
            <motion.div variants={itemVariants}>
              <h5 className="text-xs font-medium text-foreground mb-1">
                Remaining free messages
              </h5>
              <div className="flex items-center gap-4">
                <p
                  className={`text-sm ${isLowMessages ? "text-red-500 font-medium" : ""}`}
                >
                  {remainingMessages}
                </p>
                <Link
                  href={`/dashboard/${project.id}/settings`}
                  className="text-xs font-semibold underline"
                >
                  Add provider key
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
