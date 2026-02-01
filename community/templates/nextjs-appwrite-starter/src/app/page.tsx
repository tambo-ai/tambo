"use client";

import { ChatInterface } from "@/components/chat-interface";
import { account } from "@/lib/appwrite";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await account.get();
        setIsAuthenticated(true);
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-background">
        <div className="flex items-center gap-4 animate-pulse-soft">
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
            <span className="text-lg font-medium text-muted-foreground">
              Appwrite
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <ChatInterface />
    </div>
  );
}
