import { motion } from "framer-motion";
import { memo } from "react";
import { formatDateSeparator } from "../utils";

interface DateSeparatorProps {
  date: string | Date;
}

export const DateSeparator = memo(({ date }: DateSeparatorProps) => {
  return (
    <motion.div
      className="flex justify-center items-center py-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-muted/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-foreground shadow-sm border border-border/50">
        {formatDateSeparator(date)}
      </div>
    </motion.div>
  );
});

DateSeparator.displayName = "DateSeparator";
