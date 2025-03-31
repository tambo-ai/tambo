import { getSupabaseClient } from "@/app/utils/supabase";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface AuthFormProps {
  routeOnSuccess: string;
}

type AuthProvider = "github" | "google";

export function AuthForm({ routeOnSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = getSupabaseClient();

  const handleAuth = async (provider: AuthProvider) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${routeOnSuccess}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Auth failed:", error);
      toast({
        title: "Error",
        description: "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] w-full px-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border-2">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome to Tambo
            </CardTitle>
            <CardDescription className="text-base">
              Get started by signing in with your preferred method
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={async () => await handleAuth("github")}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02] hover:bg-accent hover:text-accent-foreground"
            >
              <Icons.github className="mr-3 h-5 w-5" />
              Continue with GitHub
            </Button>
            <Button
              variant="outline"
              onClick={async () => await handleAuth("google")}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02] hover:bg-accent hover:text-accent-foreground"
            >
              <Icons.google className="mr-3 h-5 w-5" />
              Continue with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
