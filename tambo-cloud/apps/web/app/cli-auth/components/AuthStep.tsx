import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/app/utils/supabase";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { memo } from "react";

type AuthProvider = "github" | "google";

interface AuthStepProps {
  onAuth: (provider: AuthProvider) => Promise<void>;
}

/**
 * AuthStep Component
 *
 * Provides authentication options for users:
 * - Email/Password authentication
 * - GitHub authentication
 * - Google authentication
 */
export const AuthStep = memo(function AuthStep({ onAuth }: AuthStepProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = getSupabaseClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const {
          data: { user },
          error,
        } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (!user) throw new Error("User creation failed.");
        toast({
          title: "Success",
          description: "Account created!",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `An unknown error occurred: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">
          Choose your preferred authentication method to continue
        </p>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        <Button
          type="button"
          variant="link"
          className="w-full"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={async () => await onAuth("github")}
        className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02]"
      >
        <Icons.github className="mr-2 h-5 w-5" />
        Continue with GitHub
      </Button>
      <Button
        variant="outline"
        onClick={async () => await onAuth("google")}
        className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02]"
      >
        <Icons.google className="mr-2 h-5 w-5" />
        Continue with Google
      </Button>
    </div>
  );
});
