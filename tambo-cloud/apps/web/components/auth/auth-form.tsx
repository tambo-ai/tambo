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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface AuthFormProps {
  isSignUpInitialValue: boolean;
  routeOnSuccess: string;
}

export function AuthForm({
  isSignUpInitialValue,
  routeOnSuccess,
}: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(isSignUpInitialValue);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = getSupabaseClient();

  const handleSocialAuth = async (provider: "github" | "google") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${routeOnSuccess}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Failed to authenticate. Please try again. " +
          (error instanceof Error
            ? error.message
            : `An unknown error occurred: ${error}`),
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const {
          data: { user },
          error,
        } = await getSupabaseClient().auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (!user) throw new Error("User creation failed.");
        // User is now automatically created by supabase
        // const userData: UserDto = {
        //   authId: user.id,
        //   email: email,
        // };
        // await createUser(userData);
        toast({
          title: "Success",
          description: "Account created!",
        });
        window.location.href = routeOnSuccess;
      } else {
        const { error } = await getSupabaseClient().auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = routeOnSuccess;
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isSignUp ? "Create an account" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isSignUp
            ? "Enter your email to create your account"
            : "Enter your credentials to access your account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
          </div>
          <div className="mt-4 flex flex-col space-y-4">
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
          </div>
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

        <div className="grid grid-cols-1 gap-4">
          <Button
            variant="outline"
            onClick={async () => await handleSocialAuth("github")}
            className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02]"
          >
            <Icons.github className="mr-2 h-5 w-5" />
            Continue with GitHub
          </Button>
          <Button
            variant="outline"
            onClick={async () => await handleSocialAuth("google")}
            className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02]"
          >
            <Icons.google className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
