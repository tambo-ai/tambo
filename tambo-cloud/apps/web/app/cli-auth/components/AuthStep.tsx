import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { memo } from "react";

type AuthProvider = "github" | "google";

interface AuthStepProps {
  onAuth: (provider: AuthProvider) => Promise<void>;
}

/**
 * AuthStep Component
 *
 * Provides authentication options for users:
 * - GitHub authentication
 * - Google authentication
 */
export const AuthStep = memo(function AuthStep({ onAuth }: AuthStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">
          Choose your preferred authentication method to continue
        </p>
      </div>

      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={async () => await onAuth("github")}
          className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02] hover:bg-accent hover:text-accent-foreground"
        >
          <Icons.github className="mr-3 h-5 w-5" />
          Continue with GitHub
        </Button>
        <Button
          variant="outline"
          onClick={async () => await onAuth("google")}
          className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02] hover:bg-accent hover:text-accent-foreground"
        >
          <Icons.google className="mr-3 h-5 w-5" />
          Continue with Google
        </Button>
      </div>
    </div>
  );
});
