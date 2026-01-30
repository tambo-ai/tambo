"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { account } from "@/lib/appwrite";
import { ID } from "appwrite";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        await account.create(ID.unique(), email, password, name);
        await account.createEmailPasswordSession(email, password);
      } else {
        await account.createEmailPasswordSession(email, password);
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      {/* Brand Header */}
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <Image
          src="/Tambo-Lockup.svg"
          alt="Tambo"
          width={120}
          height={40}
          className="h-8 w-auto"
        />
        <span className="text-2xl font-light text-muted-foreground">+</span>
        <div className="flex items-center gap-1.5">
          <Image
            src="/appwrite-icon.svg"
            alt="Appwrite"
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="text-2xl font-medium text-foreground">Appwrite</span>
        </div>
      </div>

      <Card className="w-full max-w-md border-border/50 shadow-xl shadow-muted-backdrop animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp
              ? "Enter your details to get started"
              : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  className="transition-all duration-200"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="transition-all duration-200"
              />
            </div>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full font-medium transition-all duration-200 hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading
                ? "Loading..."
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-medium underline-offset-4 hover:underline transition-colors"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-sm text-muted-foreground animate-fade-in">
        Powered by{" "}
        <a
          href="https://tambo.co"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-foreground transition-colors"
        >
          Tambo
        </a>
        ,{" "}
        <a
          href="https://appwrite.io"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-foreground transition-colors"
        >
          Appwrite
        </a>
        {" & "}
        <a
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-foreground transition-colors"
        >
          Next.js
        </a>
      </p>
    </div>
  );
}
