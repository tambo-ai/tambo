import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary via-secondary to-accent opacity-80" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tambo AI
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to chat with your AI assistant
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-xs sm:text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
