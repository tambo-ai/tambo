import { CopyButton } from "@/components/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { type RouterOutputs } from "@/trpc/react";
import { motion } from "framer-motion";
import { z } from "zod";

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
  if (!project) {
    return (
      <Card className="border rounded-md overflow-hidden">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">No project found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="text-xl font-semibold font-heading">{project.name}</h4>
        </motion.div>

        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <h5 className="text-xs font-medium text-muted-foreground mb-1">
              Project ID
            </h5>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded-md">
                {project.id}
              </code>
              <CopyButton clipboardValue={project.id} />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h5 className="text-xs font-medium text-muted-foreground mb-1">
              Owner
            </h5>
            <p className="text-sm">{project.userId}</p>
          </motion.div>

          {createdAt && (
            <motion.div variants={itemVariants}>
              <h5 className="text-xs font-medium text-muted-foreground mb-1">
                Created
              </h5>
              <p className="text-sm">{createdAt}</p>
            </motion.div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
