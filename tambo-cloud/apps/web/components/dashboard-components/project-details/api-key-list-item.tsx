import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { motion, Variants } from "framer-motion";
import { Trash2 } from "lucide-react";

const listItemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

interface APIKeyListItemProps {
  apiKey: {
    id: string;
    name: string;
    partiallyHiddenKey?: string | null;
  };
  index: number;
  onDelete: (id: string) => void;
}

export function APIKeyListItem({
  apiKey,
  index,
  onDelete,
}: APIKeyListItemProps) {
  const [, copy] = useClipboard(apiKey.partiallyHiddenKey ?? "");

  return (
    <motion.div
      key={apiKey.id}
      custom={index}
      variants={listItemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <div className="flex flex-row items-start sm:items-center gap-2 sm:gap-3">
        {/* API Key Name */}
        <div className="min-w-[140px]">
          <p className="text-sm font-medium">{apiKey.name}</p>
        </div>

        {/* API Key Value - clickable to copy */}
        <button
          onClick={async () => await copy()}
          className="text-xs text-foreground font-mono px-2 py-1 bg-accent rounded-full min-w-[120px] hover:bg-accent/80 transition-colors cursor-pointer"
          title="Click to copy"
        >
          {apiKey.partiallyHiddenKey?.slice(0, 15)}
        </button>

        {/* Delete Button */}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive bg-destructive/10 flex-shrink-0 rounded-full"
          onClick={() => onDelete(apiKey.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
