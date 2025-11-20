import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useClipboard } from "@/hooks/use-clipboard";
import { motion, Variants } from "framer-motion";
import { Check, Copy } from "lucide-react";

const cardItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description: string;
    command: string;
    recommended: boolean;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export function TemplateCard({
  template,
  isSelected,
  onSelect,
}: TemplateCardProps) {
  const [copied, copy] = useClipboard(template.command);

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-all border-2 ${
        isSelected
          ? "border-primary/50 bg-primary/5"
          : "hover:border-primary/50"
      }`}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <CardDescription className="text-sm font-sans text-foreground">
                {template.description}
              </CardDescription>
            </div>
          </div>
          {template.recommended && (
            <Badge variant="secondary">Recommended</Badge>
          )}
        </div>
      </CardHeader>

      {isSelected && (
        <CardContent className="pt-0">
          <motion.div className="space-y-3" variants={cardItemVariants}>
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono">{template.command}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await copy();
                  }}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-sm text-foreground space-y-2">
              <p>
                <strong>Next steps:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Run the command above in your terminal</li>
                <li>
                  Navigate to your project: <code>cd my-app</code>
                </li>
                <li>
                  Initialize Tambo: <code>npx tambo init</code>
                </li>
                <li>
                  Start development: <code>npm run dev</code>
                </li>
              </ol>
            </div>
          </motion.div>
        </CardContent>
      )}
    </Card>
  );
}
