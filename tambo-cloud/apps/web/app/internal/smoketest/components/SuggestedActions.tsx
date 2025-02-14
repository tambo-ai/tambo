import { Button } from "@/components/ui/button";

interface SuggestedAction {
  label: string;
  actionText: string;
}

interface SuggestedActionsProps {
  actions: SuggestedAction[];
  onActionClick: (actionText: string) => void;
}

export function SuggestedActions({
  actions,
  onActionClick,
}: SuggestedActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant="secondary"
          size="sm"
          onClick={() => onActionClick(action.actionText)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
